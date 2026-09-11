import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const bodyPartId = req.nextUrl.searchParams.get("bodyPartId");

  const exercises = await prisma.exercise.findMany({
    where: bodyPartId ? { bodyPartId } : undefined,
    include: { bodyPart: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const bodyPartId = String(body.bodyPartId ?? "").trim();

  if (!name || !bodyPartId) {
    return NextResponse.json(
      { error: "メニュー名と部位タグを指定してください" },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.exercise.create({
      data: { name, bodyPartId },
      include: { bodyPart: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "同じ名前のメニューが既に存在します" }, { status: 409 });
  }
}
