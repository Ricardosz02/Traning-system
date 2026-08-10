import { supabase } from "../lib/supabase";

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Błąd rejestracji:", error.message);
    throw new Error(error.message);
  }

  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Błąd logowania:", error.message);
    throw new Error("Nieprawidłowy email lub hasło.");
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Błąd wylogowywania:", error.message);
    throw new Error(error.message);
  }
};
