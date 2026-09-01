import { supabase } from "../lib/supabase";
import { BodyMeasurement } from "../types/database.types";

export const fetchMeasurements = async (
  userId: string,
): Promise<BodyMeasurement[]> => {
  const { data, error } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Błąd pobierania pomiarów: ${error.message}`);
  }

  return data || [];
};

export const addMeasurement = async (
  userId: string,
  measurementData: Partial<
    Omit<BodyMeasurement, "id" | "user_id" | "created_at">
  >,
): Promise<BodyMeasurement> => {
  const { data, error } = await supabase
    .from("body_measurements")
    .insert({
      user_id: userId,
      ...measurementData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Błąd zapisu pomiarów: ${error.message}`);
  }

  return data as BodyMeasurement;
};

export const deleteMeasurement = async (
  measurementId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("body_measurements")
    .delete()
    .eq("id", measurementId);

  if (error) {
    throw new Error(`Błąd usuwania pomiaru: ${error.message}`);
  }
};
