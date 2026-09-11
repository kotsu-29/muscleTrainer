import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const exerciseId = req.nextUrl.searchParams.get("exerciseId");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId is required" }, { status: 400 });
  }

  const logs = await prisma.workoutLog.findMany({
    where: {
      exerciseId,
      date: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    orderBy: { date: "asc" },
  });

  const byDate = new Map<
    string,
    { date: string; maxWeight: number; totalVolume: number; totalSets: number; totalReps: number }
  >();

  for (const log of logs) {
    const key = log.date.toISOString().slice(0, 10);
    const volume = log.weight * log.reps * log.sets;
    const existing = byDate.get(key);
    if (existing) {
      existing.maxWeight = Math.max(existing.maxWeight, log.weight);
      existing.totalVolume += volume;
      existing.totalSets += log.sets;
      existing.totalReps += log.reps * log.sets;
    } else {
      byDate.set(key, {
        date: key,
        maxWeight: log.weight,
        totalVolume: volume,
        totalSets: log.sets,
        totalReps: log.reps * log.sets,
      });
    }
  }

  const points = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(points);
}
