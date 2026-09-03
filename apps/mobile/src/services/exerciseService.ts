import { supabase } from "../lib/supabase";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string[];
  description: string;
  category: string;
  video_url?: string;
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

export const updateExerciseVideoUrl = async (
  exerciseId: string,
  videoUrl: string,
) => {
  const { data, error } = await supabase
    .from("exercises")
    .update({ video_url: videoUrl || null })
    .eq("id", exerciseId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};
