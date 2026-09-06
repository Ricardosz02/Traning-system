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

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:5173/reset-password",
  });

  if (error) {
    console.error("Błąd resetowania hasła:", error.message);
    throw new Error(error.message);
  }
};

export const updateEmail = async (newEmail: string) => {
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    console.error("Błąd zmiany e-maila:", error.message);
    throw new Error(error.message);
  }
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Błąd zmiany hasła:", error.message);
    throw new Error(error.message);
  }
};
