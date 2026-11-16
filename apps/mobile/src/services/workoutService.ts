import { supabase } from "../lib/supabase";
import { WorkoutExercise } from "../store/workoutStore";

const inferMuscleGroupsFromName = (name: string): string[] => {
  const n = name.toLowerCase();
  const inferred: string[] = [];

  if (
    n.includes("klat") ||
    n.includes("bench") ||
    n.includes("rozpięt") ||
    n.includes("pompk") ||
    n.includes("chest")
  ) {
    inferred.push("CHEST");
  }
  if (
    n.includes("wiosł") ||
    n.includes("ściąg") ||
    n.includes("podciąg") ||
    n.includes("lat") ||
    n.includes("pull") ||
    n.includes("row")
  ) {
    inferred.push("BACK_LATS");
  }
  if (
    n.includes("kaptur") ||
    n.includes("szrugs") ||
    n.includes("shrug") ||
    n.includes("trap")
  ) {
    inferred.push("BACK_TRAPS");
  }
  if (
    n.includes("martwy") ||
    n.includes("deadlift") ||
    n.includes("prostownik") ||
    n.includes("dzień dobry")
  ) {
    inferred.push("BACK_ERECTORS", "HAMSTRINGS", "GLUTES");
  }
  if (
    n.includes("bark") ||
    n.includes("żołnier") ||
    n.includes("ohp") ||
    n.includes("wznos") ||
    n.includes("shoulder") ||
    n.includes("delt")
  ) {
    inferred.push("SHOULDERS_FRONT", "SHOULDERS_MID");
  }
  if (n.includes("biceps") || n.includes("uginan") || n.includes("curl")) {
    inferred.push("BICEPS");
  }
  if (
    n.includes("triceps") ||
    n.includes("francusk") ||
    n.includes("prostowan") ||
    n.includes("dipy") ||
    n.includes("dip")
  ) {
    inferred.push("TRICEPS");
  }
  if (
    n.includes("przedrami") ||
    n.includes("nadgarst") ||
    n.includes("forearm")
  ) {
    inferred.push("FOREARMS");
  }
  if (
    n.includes("brzuch") ||
    n.includes("plank") ||
    n.includes("deska") ||
    n.includes("spięc") ||
    n.includes("abs") ||
    n.includes("core")
  ) {
    inferred.push("ABS_RECTUS");
  }
  if (
    n.includes("przysiad") ||
    n.includes("squat") ||
    n.includes("wypychan") ||
    n.includes("wykrok") ||
    n.includes("czworogłow") ||
    n.includes("quad")
  ) {
    inferred.push("QUADS");
  }
  if (n.includes("dwugłow") || n.includes("hamstring") || n.includes("rdl")) {
    inferred.push("HAMSTRINGS");
  }
  if (n.includes("poślad") || n.includes("hip thrust") || n.includes("glute")) {
    inferred.push("GLUTES");
  }
  if (
    n.includes("łyd") ||
    n.includes("wspięc") ||
    n.includes("calf") ||
    n.includes("calves")
  ) {
    inferred.push("CALVES");
  }

  return inferred;
};

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
        const inferredMuscles = inferMuscleGroupsFromName(ex.name);
        const { data: newEx, error: newExError } = await supabase
          .from("exercises")
          .insert([
            {
              name: ex.name,
              ...(inferredMuscles.length > 0
                ? { muscle_group: inferredMuscles }
                : {}),
            },
          ])
          .select("id")
          .single();

        if (newExError) {
          throw new Error(
            `Błąd tworzenia ćwiczenia w słowniku. Komunikat: ${newExError.message}`,
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
          rest_time: set.restTime || 90,
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
      .select("weight, reps, rpe, set_order, rest_time")
      .eq("workout_id", lastWorkoutId)
      .eq("exercise_id", searchExerciseId)
      .order("set_order", { ascending: true });

    if (setsError) throw setsError;

    return sets.map((s) => ({
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
      set_order: s.set_order,
      restTime: s.rest_time,
    }));
  } catch (error) {
    console.error("Błąd podczas pobierania historii ćwiczenia:", error);
    return null;
  }
};

export interface HistorySetItem {
  id: string;
  weight: number;
  reps: number;
  rpe: number | null;
  setOrder: number;
}

export interface HistoryExerciseGroup {
  exerciseId: string;
  exerciseName: string;
  muscleGroups: string[];
  sets: HistorySetItem[];
}

export interface WorkoutHistoryItem {
  id: string;
  startedAt: string;
  endedAt: string;
  totalVolume: number;
  durationMinutes: number;
  exercises: HistoryExerciseGroup[];
}

export const fetchWorkoutHistory = async (
  userId: string,
): Promise<WorkoutHistoryItem[]> => {
  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      id,
      started_at,
      ended_at,
      total_volume,
      workout_sets (
        id,
        weight,
        reps,
        rpe,
        set_order,
        exercise:exercises (
          id,
          name,
          muscle_group
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (error) {
    throw new Error(`Błąd pobierania historii treningów: ${error.message}`);
  }

  const { data: customItems } = await supabase
    .from("custom_workout_items")
    .select("exercise_name, muscle_group");

  const customMuscleMap = new Map<string, string[]>();
  (customItems || []).forEach((ci: any) => {
    if (ci.exercise_name && ci.muscle_group) {
      const groups = Array.isArray(ci.muscle_group)
        ? ci.muscle_group
        : [ci.muscle_group];
      if (groups.length > 0) {
        customMuscleMap.set(ci.exercise_name.toLowerCase().trim(), groups);
      }
    }
  });

  return (data || []).map((workout: any) => {
    const start = new Date(workout.started_at).getTime();
    const end = workout.ended_at ? new Date(workout.ended_at).getTime() : start;
    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

    const sortedSets = [...(workout.workout_sets || [])].sort(
      (a, b) => (a.set_order || 0) - (b.set_order || 0),
    );

    const groupedMap = new Map<string, HistoryExerciseGroup>();

    sortedSets.forEach((s: any) => {
      const exId = s.exercise?.id || "unknown";
      const exName = s.exercise?.name || "Ćwiczenie";

      let muscleGroups: string[] = [];
      const rawMg = s.exercise?.muscle_group;

      if (Array.isArray(rawMg) && rawMg.length > 0) {
        muscleGroups = rawMg;
      } else if (typeof rawMg === "string" && rawMg.trim().length > 0) {
        muscleGroups = [rawMg.trim()];
      } else {
        const fromCustom = customMuscleMap.get(exName.toLowerCase().trim());
        if (fromCustom && fromCustom.length > 0) {
          muscleGroups = fromCustom;
        } else {
          muscleGroups = inferMuscleGroupsFromName(exName);
        }
      }

      if (!groupedMap.has(exId)) {
        groupedMap.set(exId, {
          exerciseId: exId,
          exerciseName: exName,
          muscleGroups,
          sets: [],
        });
      }

      groupedMap.get(exId)!.sets.push({
        id: s.id,
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        rpe: s.rpe !== null && s.rpe !== undefined ? Number(s.rpe) : null,
        setOrder: s.set_order || 1,
      });
    });

    return {
      id: workout.id,
      startedAt: workout.started_at,
      endedAt: workout.ended_at,
      totalVolume: Number(workout.total_volume) || 0,
      durationMinutes,
      exercises: Array.from(groupedMap.values()),
    };
  });
};
