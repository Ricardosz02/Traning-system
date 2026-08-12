export type MuscleGroup =
  "CHEST" | "BACK" | "LEGS" | "SHOULDERS" | "ARMS" | "CORE";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description?: string;
}
