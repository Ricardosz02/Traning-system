import { supabase } from "../lib/supabase";
import { Profile } from "../types/database.types";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

export const fetchUserProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Błąd pobierania profilu: ${error.message}`);
  }

  return data as Profile;
};

export const updateUserProfile = async (
  userId: string,
  userEmail: string | undefined,
  updates: Partial<Omit<Profile, "id" | "email" | "role" | "created_at">>,
): Promise<Profile> => {
  const { data: updateData, error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (updateData) {
    return updateData as Profile;
  }

  if (updateError) {
    throw new Error(`Błąd aktualizacji profilu: ${updateError.message}`);
  }

  const { data: insertData, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: userEmail || "brak@emaila.pl",
      role: "USER",
      ...updates,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(
      `Błąd tworzenia brakującego profilu: ${insertError.message}`,
    );
  }

  return insertData as Profile;
};

export const uploadAvatar = async (
  userId: string,
  uri: string,
): Promise<string> => {
  const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });

  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, arrayBuffer, {
      contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Błąd wysyłania zdjęcia: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data.publicUrl;
};
