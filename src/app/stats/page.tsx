import { prisma } from "@/lib/prisma";
import StatsClient from "@/components/StatsClient";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const bodyParts = await prisma.bodyPart.findMany({
    orderBy: { order: "asc" },
    include: { exercises: { orderBy: { name: "asc" } } },
  });

  const hasAnyExercise = bodyParts.some((bp) => bp.exercises.length > 0);

  return (
    <StatsClient
      bodyParts={JSON.parse(JSON.stringify(bodyParts))}
      hasAnyExercise={hasAnyExercise}
    />
  );
}
