import { supabase } from "../lib/supabase";
import { WorkoutExercise } from "../store/workoutStore";

export const saveWorkoutSession = async (
  userId: string,
  startedAt: string,
  endedAt: string,
  exercises: WorkoutExercise[],
) => {
  const totalVolume = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((setAcc: number, set: any) => {
        return set.completed ? setAcc + set.weight * set.reps : setAcc;
      }, 0)
    );
  }, 0);

  const realExerciseIds: Record<string, string> = {};

  for (const ex of exercises) {
    const { data: existingEx } = await supabase
      .from("exercises")
      .select("id")
      .eq("id", ex.exerciseId)
      .maybeSingle();

    if (existingEx) {
      realExerciseIds[ex.exerciseId] = existingEx.id;
    } else {
      const { data: byName } = await supabase
        .from("exercises")
        .select("id")
        .ilike("name", ex.name)
        .limit(1);

      if (byName && byName.length > 0) {
        realExerciseIds[ex.exerciseId] = byName[0].id;
      } else {
        const { data: newEx, error: newExError } = await supabase
          .from("exercises")
          .insert([{ name: ex.name }])
          .select("id")
          .single();

        if (newExError) {
          throw new Error(
            `Błąd tworzenia ćwiczenia w słowniku. Sprawdź, czy tabela 'exercises' nie wymaga podania kategorii. Komunikat: ${newExError.message}`,
          );
        }
        realExerciseIds[ex.exerciseId] = newEx.id;
      }
    }
  }

  const { data: workoutData, error: workoutError } = await supabase
    .from("workouts")
    .insert([
      {
        user_id: userId,
        started_at: startedAt,
        ended_at: endedAt,
        total_volume: totalVolume,
      },
    ])
    .select()
    .single();

  if (workoutError) {
    throw new Error(`Błąd zapisu treningu: ${workoutError.message}`);
  }

  const setsToInsert: any[] = [];

  exercises.forEach((ex) => {
    const finalExerciseId = realExerciseIds[ex.exerciseId];

    ex.sets.forEach((set: any, index: number) => {
      if (set.completed) {
        setsToInsert.push({
          workout_id: workoutData.id,
          exercise_id: finalExerciseId,
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

export const fetchLastExerciseSets = async (
  userId: string,
  exerciseId: string,
) => {
  try {
    let searchExerciseId = exerciseId;

    const { data: exists } = await supabase
      .from("exercises")
      .select("id")
      .eq("id", exerciseId)
      .maybeSingle();

    if (!exists) {
      const { data: customItem } = await supabase
        .from("custom_workout_items")
        .select("exercise_name")
        .eq("id", exerciseId)
        .maybeSingle();

      if (customItem && customItem.exercise_name) {
        const { data: realEx } = await supabase
          .from("exercises")
          .select("id")
          .ilike("name", customItem.exercise_name)
          .limit(1);

        if (realEx && realEx.length > 0) {
          searchExerciseId = realEx[0].id;
        } else {
          return null;
        }
      }
    }

    const { data: latestSet, error: latestSetError } = await supabase
      .from("workout_sets")
      .select("workout_id, workouts!inner(user_id, created_at)")
      .eq("workouts.user_id", userId)
      .eq("exercise_id", searchExerciseId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestSetError || !latestSet || latestSet.length === 0) {
      return null;
    }

    const lastWorkoutId = latestSet[0].workout_id;

    const { data: sets, error: setsError } = await supabase
      .from("workout_sets")
      .select("weight, reps, rpe, set_order")
      .eq("workout_id", lastWorkoutId)
      .eq("exercise_id", searchExerciseId)
      .order("set_order", { ascending: true });

    if (setsError) throw setsError;

    return sets;
  } catch (error) {
    console.error("Błąd podczas pobierania historii ćwiczenia:", error);
    return null;
  }
};
