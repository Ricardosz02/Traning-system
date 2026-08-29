import { create } from 'zustand';

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  rpe: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
}

interface WorkoutStore {
  isActive: boolean;
  startTime: Date | null;
  exercises: WorkoutExercise[];
  
  startWorkout: () => void;
  endWorkout: () => void;
  addExercise: (exerciseId: string, name: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, field: keyof WorkoutSet, value: number | boolean) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  isActive: false,
  startTime: null,
  exercises: [],

  startWorkout: () => set({ isActive: true, startTime: new Date(), exercises: [] }),
  
  endWorkout: () => set({ isActive: false, startTime: null, exercises: [] }),

  addExercise: (exerciseId, name) => 
    set((state) => ({
      exercises: [
        ...state.exercises,
        {
          id: Date.now().toString(),
          exerciseId,
          name,
          sets: [],
        },
      ],
    })),

  addSet: (exerciseId) =>
    set((state) => ({
      exercises: state.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: WorkoutSet = {
            id: Date.now().toString(),
            weight: lastSet ? lastSet.weight : 0,
            reps: lastSet ? lastSet.reps : 0,
            rpe: lastSet ? lastSet.rpe : 8,
            completed: false,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      }),
    })),

  updateSet: (exerciseId, setId, field, value) =>
    set((state) => ({
      exercises: state.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
          };
        }
        return ex;
      }),
    })),
}));