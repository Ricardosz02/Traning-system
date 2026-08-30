import { supabase } from '../lib/supabase';
import { TrainingPlan, PlanExercise } from '../types/database.types';

export const fetchUserPlans = async (userId: string): Promise<TrainingPlan[]> => {
  const { data, error } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Błąd pobierania planów: ${error.message}`);
  }

  return data || [];
};

export const createPlanWithExercises = async (
  userId: string,
  name: string,
  description: string,
  exercises: Omit<PlanExercise, 'id' | 'created_at' | 'plan_id'>[]
) => {
  const { data: plan, error: planError } = await supabase
    .from('training_plans')
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
      .from('plan_exercises')
      .insert(exercisesToInsert);

    if (exercisesError) {
      throw new Error(`Błąd dodawania ćwiczeń: ${exercisesError.message}`);
    }
  }

  return plan;
};

export const fetchPlanDetails = async (planId: string) => {
  const { data, error } = await supabase
    .from('plan_exercises')
    .select(`
      *,
      exercise:exercises (*)
    `)
    .eq('plan_id', planId)
    .order('day_of_week', { ascending: true })
    .order('order_in_day', { ascending: true });

  if (error) {
    throw new Error(`Błąd pobierania szczegółów planu: ${error.message}`);
  }

  return data;
};