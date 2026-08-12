import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

export const getExercises = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({
      status: "success",
      results: data.length,
      data,
    });
  } catch (error) {
    console.error("Blad w kontrolerze getExercises:", error);
    res.status(500).json({
      status: "error",
      message: "Wewnetrzny blad serwera podczas pobierania cwiczen.",
    });
  }
};

export const createExercise = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, category, muscle_group, description } = req.body;

    if (!name || !category || !muscle_group || !Array.isArray(muscle_group)) {
      res.status(400).json({
        status: "error",
        message:
          "Brak wymaganych pol (name, category) lub muscle_group nie jest tablica.",
      });
      return;
    }

    const { data, error } = await supabase
      .from("exercises")
      .insert([{ name, category, muscle_group, description }])
      .select();

    if (error) throw error;

    res.status(201).json({
      status: "success",
      message: "Cwiczenie zostalo dodane pomyslnie.",
      data: data[0],
    });
  } catch (error) {
    console.error("Blad w kontrolerze createExercise:", error);
    res.status(500).json({
      status: "error",
      message: "Wewnetrzny blad serwera podczas dodawania cwiczenia.",
    });
  }
};
