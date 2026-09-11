import { prisma } from "@/lib/prisma";
import ExercisesClient from "@/components/ExercisesClient";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const bodyParts = await prisma.bodyPart.findMany({
    orderBy: { order: "asc" },
    include: { exercises: { orderBy: { name: "asc" } } },
  });

  return <ExercisesClient bodyParts={JSON.parse(JSON.stringify(bodyParts))} />;
}
