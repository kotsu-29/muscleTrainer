export type BodyPartDto = {
  id: string;
  name: string;
  color: string;
  order: number;
  _count?: { exercises: number };
};

export type ExerciseDto = {
  id: string;
  name: string;
  bodyPartId: string;
  bodyPart: BodyPartDto;
};

export type BodyPartWithExercises = BodyPartDto & {
  exercises: { id: string; name: string; bodyPartId: string }[];
};

export type WorkoutLogDto = {
  id: string;
  date: string;
  exerciseId: string;
  weight: number;
  reps: number;
  sets: number;
  memo: string | null;
  exercise: ExerciseDto;
};

export type ExerciseTrendPoint = {
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
};

export type BodyPartStat = {
  bodyPartId: string;
  name: string;
  color: string;
  totalVolume: number;
  sessionCount: number;
};
