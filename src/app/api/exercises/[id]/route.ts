import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const usageCount = await prisma.workoutLog.count({ where: { exerciseId: id } });
  if (usageCount > 0) {
    return NextResponse.json(
      { error: "記録が存在するメニューは削除できません" },
      { status: 409 }
    );
  }

  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
