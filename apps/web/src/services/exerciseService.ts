import { supabase } from '../config/supabaseClient';
import type { Exercise } from '../types/database.types';

export const getExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Błąd serwisu podczas pobierania ćwiczeń:', error.message);
    throw new Error('Nie udało się pobrać listy ćwiczeń.');
  }

  return data as Exercise[];
};

export const addExercise = async (
  newExercise: Omit<Exercise, 'id' | 'created_at'>
): Promise<Exercise> => {
  const { data, error } = await supabase
    .from('exercises')
    .insert([newExercise])
    .select()
    .single();

  if (error) {
    console.error('Błąd serwisu podczas dodawania ćwiczenia:', error.message);
    throw new Error('Nie udało się dodać ćwiczenia.');
  }

  return data as Exercise;
};