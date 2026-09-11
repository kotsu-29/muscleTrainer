import { prisma } from "@/lib/prisma";
import HistoryClient from "@/components/HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const logs = await prisma.workoutLog.findMany({
    include: { exercise: { include: { bodyPart: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  const grouped = new Map<string, typeof logs>();
  for (const log of logs) {
    const key = log.date.toISOString().slice(0, 10);
    const list = grouped.get(key);
    if (list) list.push(log);
    else grouped.set(key, [log]);
  }

  const days = Array.from(grouped.entries()).map(([date, dayLogs]) => ({
    date,
    logs: dayLogs,
    totalVolume: dayLogs.reduce((s, l) => s + l.weight * l.reps * l.sets, 0),
  }));

  return <HistoryClient days={JSON.parse(JSON.stringify(days))} />;
}
