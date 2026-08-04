export type MuscleGroup = 'CHEST' | 'BACK' | 'LEGS' | 'SHOULDERS' | 'ARMS' | 'CORE';
export type ExerciseCategory = 'STRENGTH' | 'CALISTHENICS' | 'CROSSFIT';
export type UserRole = 'USER' | 'ADMIN';

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