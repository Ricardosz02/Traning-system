export type MuscleGroup =
  | "CHEST"
  | "BACK_LATS"
  | "BACK_TRAPS"
  | "BACK_ERECTORS"
  | "SHOULDERS_FRONT"
  | "SHOULDERS_MID"
  | "SHOULDERS_REAR"
  | "BICEPS"
  | "TRICEPS"
  | "FOREARMS"
  | "ABS_RECTUS"
  | "ABS_OBLIQUES"
  | "ABS_TRANSVERSE"
  | "QUADS"
  | "HAMSTRINGS"
  | "GLUTES"
  | "CALVES";
export type ExerciseCategory = "STRENGTH" | "CALISTHENICS" | "CROSSFIT";
export type UserRole = "USER" | "ADMIN";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscle_group: MuscleGroup[];
  category: ExerciseCategory;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  total_volume: number;
  created_at: string;
}

export interface WorkoutSetRecord {
  id: string;
  workout_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  rpe: number | null;
  set_order: number;
  created_at: string;
}
