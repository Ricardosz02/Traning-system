export type MuscleGroup = 'CHEST' | 'BACK' | 'LEGS' | 'SHOULDERS' | 'ARMS' | 'CORE';
export type ExerciseCategory = 'STRENGTH' | 'CALISTHENICS' | 'CROSSFIT';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscle_group: MuscleGroup[];
  category: ExerciseCategory;
  created_at: string;
}