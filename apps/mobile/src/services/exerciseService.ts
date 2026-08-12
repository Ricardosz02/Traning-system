import { supabase } from "../lib/supabase";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string[];
  description: string;
  category: string;
}

export const fetchExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Błąd pobierania ćwiczeń:", error.message);
    throw new Error("Nie udało się pobrać listy ćwiczeń.");
  }

  return data || [];
};
