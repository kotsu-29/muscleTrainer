import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { date, exerciseId, weight, reps, sets, memo } = body;

  const data: {
    date?: Date;
    exerciseId?: string;
    weight?: number;
    reps?: number;
    sets?: number;
    memo?: string | null;
  } = {};

  if (date !== undefined) data.date = new Date(date);
  if (exerciseId !== undefined) data.exerciseId = String(exerciseId);
  if (weight !== undefined) data.weight = Number(weight);
  if (reps !== undefined) data.reps = Number(reps);
  if (sets !== undefined) data.sets = Number(sets);
  if (memo !== undefined) data.memo = memo ? String(memo) : null;

  const updated = await prisma.workoutLog.update({
    where: { id },
    data,
    include: { exercise: { include: { bodyPart: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.workoutLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
