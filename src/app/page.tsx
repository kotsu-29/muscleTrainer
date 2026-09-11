import { prisma } from "@/lib/prisma";
import RecordClient from "@/components/RecordClient";

export const dynamic = "force-dynamic";

function todayDateString() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const today = todayDateString();
  const { date: dateParam } = await searchParams;
  const initialDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam <= today
    ? dateParam
    : today;

  const [bodyParts, logs] = await Promise.all([
    prisma.bodyPart.findMany({
      orderBy: { order: "asc" },
      include: { exercises: { orderBy: { name: "asc" } } },
    }),
    prisma.workoutLog.findMany({
      where: {
        date: {
          gte: new Date(`${initialDate}T00:00:00`),
          lte: new Date(`${initialDate}T23:59:59`),
        },
      },
      include: { exercise: { include: { bodyPart: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <RecordClient
      bodyParts={JSON.parse(JSON.stringify(bodyParts))}
      initialLogs={JSON.parse(JSON.stringify(logs))}
      today={today}
      initialDate={initialDate}
    />
  );
}
