export type MuscleGroup = 
  | 'CHEST' 
  | 'BACK_LATS' | 'BACK_TRAPS' | 'BACK_ERECTORS'
  | 'SHOULDERS_FRONT' | 'SHOULDERS_MID' | 'SHOULDERS_REAR'
  | 'BICEPS' | 'TRICEPS' | 'FOREARMS'
  | 'ABS_RECTUS' | 'ABS_OBLIQUES' | 'ABS_TRANSVERSE'
  | 'QUADS' | 'HAMSTRINGS' | 'GLUTES' | 'CALVES';
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