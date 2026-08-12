import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Krytyczny blad: Brak klucza GEMINI_API_KEY w pliku .env");
}

const genAI = new GoogleGenerativeAI(apiKey);

const aiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

export const generateTrainingPlanFromAI = async (
  userProfileData: any,
): Promise<string> => {
  try {
    const prompt =
      "Jestes trenerem personalnym. Napisz mi jedno przykladowe cwiczenie silowe.";

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Blad podczas komunikacji z Gemini API:", error);
    throw new Error("Nie udalo sie wygenerowac planu treningowego.");
  }
};
