import { supabase } from "../lib/supabase";
import { TrainingPlan, PlanExercise } from "../types/database.types";

export const fetchUserPlans = async (
  userId: string,
): Promise<TrainingPlan[]> => {
  const { data, error } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Błąd pobierania planów: ${error.message}`);
  }

  return data || [];
};

export const createPlanWithExercises = async (
  userId: string,
  name: string,
  description: string,
  exercises: Omit<PlanExercise, "id" | "created_at" | "plan_id">[],
) => {
  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .insert([{ user_id: userId, name, description }])
    .select()
    .single();

  if (planError) {
    throw new Error(`Błąd tworzenia nagłówka planu: ${planError.message}`);
  }

  if (exercises.length > 0) {
    const exercisesToInsert = exercises.map((ex) => ({
      ...ex,
      plan_id: plan.id,
    }));

    const { error: exercisesError } = await supabase
      .from("plan_exercises")
      .insert(exercisesToInsert);

    if (exercisesError) {
      throw new Error(`Błąd dodawania ćwiczeń: ${exercisesError.message}`);
    }
  }

  return plan;
};

export const fetchPlanDetails = async (planId: string) => {
  const { data, error } = await supabase
    .from("plan_exercises")
    .select(
      `
      *,
      exercise:exercises (*)
    `,
    )
    .eq("plan_id", planId)
    .order("day_of_week", { ascending: true })
    .order("order_in_day", { ascending: true });

  if (error) {
    throw new Error(`Błąd pobierania szczegółów planu: ${error.message}`);
  }

  return data;
};

export const fetchUserDashboardData = async (userId: string) => {
  const { data, error } = await supabase
    .from("training_plans")
    .select(
      `
      id,
      name,
      plan_exercises (
        day_of_week,
        target_sets,
        target_reps,
        exercise_id,
        exercise:exercises (name)
      )
    `,
    )
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Błąd pobierania danych dashboardu: ${error.message}`);
  }

  return data;
};

export const createCustomWorkoutPlan = async (
  userId: string,
  name: string,
  exercises: any[],
) => {
  const { data: planData, error: planError } = await supabase
    .from("custom_workouts")
    .insert([{ user_id: userId, name }])
    .select()
    .single();

  if (planError) throw planError;

  const itemsToInsert = exercises.map((ex, index) => ({
    workout_id: planData.id,
    exercise_name: ex.exercise_name,
    sets: ex.sets,
    reps: ex.reps,
    video_url: ex.video_url,
    day_of_week: ex.day_of_week,
    order_index: index,
  }));

  const { error: itemsError } = await supabase
    .from("custom_workout_items")
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  return planData;
};

export const fetchCustomUserPlans = async (userId: string) => {
  const { data, error } = await supabase
    .from("custom_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchCustomWorkoutItems = async (workoutId: string) => {
  const { data, error } = await supabase
    .from("custom_workout_items")
    .select("*")
    .eq("workout_id", workoutId)
    .order("day_of_week", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data;
};
