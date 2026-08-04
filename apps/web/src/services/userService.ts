import { supabase } from '../config/supabaseClient';
import type { Profile } from '../types/database.types';

export const getProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Błąd serwisu podczas pobierania profili:', error.message);
    throw new Error('Nie udało się pobrać listy użytkowników.');
  }

  return data as Profile[];
};