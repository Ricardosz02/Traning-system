import { supabase } from "../lib/supabase";
import { WorkoutExercise } from "../store/workoutStore";

export const saveWorkoutSession = async (
  userId: string,
  startedAt: string,
  endedAt: string,
  exercises: WorkoutExercise[]
) => {
  const totalVolume = exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((setAcc: number, set: any) => {
      return set.completed ? setAcc + (set.weight * set.reps) : setAcc;
    }, 0);
  }, 0);

  const { data: workoutData, error: workoutError } = await supabase
    .from("workouts")
    .insert([
      {
        user_id: userId,
        started_at: startedAt,
        ended_at: endedAt,
        total_volume: totalVolume,
      }
    ])
    .select()
    .single();

  if (workoutError) {
    throw new Error(`Błąd zapisu treningu: ${workoutError.message}`);
  }

  const setsToInsert: any[] = [];
  
  exercises.forEach((ex) => {
    ex.sets.forEach((set: any, index: number) => {
      if (set.completed) {
        setsToInsert.push({
          workout_id: workoutData.id,
          exercise_id: ex.exerciseId,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          set_order: index + 1,
        });
      }
    });
  });

  if (setsToInsert.length > 0) {
    const { error: setsError } = await supabase
      .from("workout_sets")
      .insert(setsToInsert);

    if (setsError) {
      throw new Error(`Błąd zapisu serii: ${setsError.message}`);
    }
  }

  return workoutData;
};