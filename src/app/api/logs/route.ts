import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const exerciseId = req.nextUrl.searchParams.get("exerciseId");
  const bodyPartId = req.nextUrl.searchParams.get("bodyPartId");

  const logs = await prisma.workoutLog.findMany({
    where: {
      date: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
      exerciseId: exerciseId ?? undefined,
      exercise: bodyPartId ? { bodyPartId } : undefined,
    },
    include: { exercise: { include: { bodyPart: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, exerciseId, weight, reps, sets, memo } = body;

  if (!date || !exerciseId) {
    return NextResponse.json(
      { error: "日付とトレーニングメニューを指定してください" },
      { status: 400 }
    );
  }

  const weightNum = Number(weight);
  const repsNum = Number(reps);
  const setsNum = Number(sets);

  if (
    !Number.isFinite(weightNum) ||
    weightNum < 0 ||
    !Number.isInteger(repsNum) ||
    repsNum <= 0 ||
    !Number.isInteger(setsNum) ||
    setsNum <= 0
  ) {
    return NextResponse.json(
      { error: "重量・回数・セット数を正しく入力してください" },
      { status: 400 }
    );
  }

  const created = await prisma.workoutLog.create({
    data: {
      date: new Date(date),
      exerciseId,
      weight: weightNum,
      reps: repsNum,
      sets: setsNum,
      memo: memo ? String(memo) : null,
    },
    include: { exercise: { include: { bodyPart: true } } },
  });

  return NextResponse.json(created, { status: 201 });
}
