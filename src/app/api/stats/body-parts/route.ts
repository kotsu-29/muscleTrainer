import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const logs = await prisma.workoutLog.findMany({
    where: {
      date: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    include: { exercise: { include: { bodyPart: true } } },
  });

  const byBodyPart = new Map<
    string,
    { bodyPartId: string; name: string; color: string; totalVolume: number; dates: Set<string> }
  >();

  for (const log of logs) {
    const bp = log.exercise.bodyPart;
    const volume = log.weight * log.reps * log.sets;
    const key = bp.id;
    const dateKey = log.date.toISOString().slice(0, 10);
    const existing = byBodyPart.get(key);
    if (existing) {
      existing.totalVolume += volume;
      existing.dates.add(dateKey);
    } else {
      byBodyPart.set(key, {
        bodyPartId: bp.id,
        name: bp.name,
        color: bp.color,
        totalVolume: volume,
        dates: new Set([dateKey]),
      });
    }
  }

  const result = Array.from(byBodyPart.values())
    .map((v) => ({
      bodyPartId: v.bodyPartId,
      name: v.name,
      color: v.color,
      totalVolume: v.totalVolume,
      sessionCount: v.dates.size,
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume);

  return NextResponse.json(result);
}
