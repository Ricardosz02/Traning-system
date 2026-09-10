import { create } from "zustand";

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

export interface HistoricalSet {
  weight: number;
  reps: number;
  rpe: number;
}

export interface PlannedExerciseInput {
  exerciseId: string;
  name: string;
  targetSets: number;
  videoUrl?: string;
  historicalSets?: HistoricalSet[];
}

interface WorkoutStore {
  isActive: boolean;
  startTime: Date | null;
  exercises: WorkoutExercise[];

  startWorkout: () => void;
  startWorkoutFromPlan: (plannedExercises: PlannedExerciseInput[]) => void;
  endWorkout: () => void;
  addExercise: (exerciseId: string, name: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (
    exerciseId: string,
    setId: string,
    field: keyof WorkoutSet,
    value: number | boolean,
  ) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  isActive: false,
  startTime: null,
  exercises: [],

  startWorkout: () =>
    set({ isActive: true, startTime: new Date(), exercises: [] }),

  startWorkoutFromPlan: (plannedExercises) =>
    set(() => {
      const exercises: WorkoutExercise[] = plannedExercises.map(
        (planEx, index) => {
          const sets: WorkoutSet[] = Array.from({
            length: planEx.targetSets,
          }).map((_, setIndex) => {
            const historySet = planEx.historicalSets?.[setIndex];
            const fallbackSet =
              planEx.historicalSets?.[planEx.historicalSets.length - 1];

            return {
              id: `${Date.now()}-${index}-${setIndex}`,
              weight: historySet?.weight ?? fallbackSet?.weight ?? 0,
              reps: historySet?.reps ?? fallbackSet?.reps ?? 0,
              rpe: historySet?.rpe ?? fallbackSet?.rpe ?? 8,
              completed: false,
            };
          });

          return {
            id: `${Date.now()}-${index}`,
            exerciseId: planEx.exerciseId,
            name: planEx.name,
            sets,
            videoUrl: planEx.videoUrl,
          };
        },
      );

      return { isActive: true, startTime: new Date(), exercises };
    }),

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
            sets: ex.sets.map((s) =>
              s.id === setId ? { ...s, [field]: value } : s,
            ),
          };
        }
        return ex;
      }),
    })),
}));
