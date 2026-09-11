import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bodyParts = await prisma.bodyPart.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { exercises: true } } },
  });
  return NextResponse.json(bodyParts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const color = String(body.color ?? "#FF6B6B").trim();

  if (!name) {
    return NextResponse.json({ error: "部位名を入力してください" }, { status: 400 });
  }

  const maxOrder = await prisma.bodyPart.aggregate({ _max: { order: true } });

  try {
    const created = await prisma.bodyPart.create({
      data: { name, color, order: (maxOrder._max.order ?? 0) + 1 },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "同じ名前の部位タグが既に存在します" }, { status: 409 });
  }
}
