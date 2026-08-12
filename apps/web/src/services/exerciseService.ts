import { supabase } from "../config/supabaseClient";
import type { Exercise } from "../types/database.types";

export const getExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Błąd serwisu podczas pobierania ćwiczeń:", error.message);
    throw new Error("Nie udało się pobrać listy ćwiczeń.");
  }

  return data as Exercise[];
};

export const addExercise = async (
  newExercise: Omit<Exercise, "id" | "created_at">,
): Promise<Exercise> => {
  const { data, error } = await supabase
    .from("exercises")
    .insert([newExercise])
    .select()
    .single();

  if (error) {
    console.error("Błąd serwisu podczas dodawania ćwiczenia:", error.message);
    throw new Error("Nie udało się dodać ćwiczenia.");
  }

  return data as Exercise;
};

export const deleteExercise = async (id: string): Promise<void> => {
  const { error } = await supabase.from("exercises").delete().eq("id", id);

  if (error) {
    console.error("Błąd serwisu podczas usuwania ćwiczenia:", error.message);
    throw new Error("Nie udało się usunąć ćwiczenia.");
  }
};

export const getExerciseById = async (id: string): Promise<Exercise> => {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Błąd podczas pobierania ćwiczenia o ID ${id}:`, error);
    throw new Error("Nie udało się pobrać danych ćwiczenia.");
  }

  return data as Exercise;
};

export const updateExercise = async (
  id: string,
  updatedData: Omit<Exercise, "id" | "created_at">,
): Promise<Exercise> => {
  const { data, error } = await supabase
    .from("exercises")
    .update(updatedData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Błąd podczas aktualizacji ćwiczenia o ID ${id}:`, error);
    throw new Error("Nie udało się zaktualizować ćwiczenia.");
  }

  return data as Exercise;
};
