import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("Brak klucza API Gemini. Sprawdź plik .env");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const generateWorkoutPlan = async (
  goal: string,
  experience: string,
  equipment: string,
  availableExercises: { id: string; name: string }[],
) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const exercisesListText = availableExercises
      .map((ex) => `- ID: ${ex.id}, Nazwa: ${ex.name}`)
      .join("\n");

    const prompt = `Jesteś ekspertem od treningu siłowego. Wygeneruj 1-dniowy plan treningowy bazując na danych:
    Cel: ${goal}
    Staż: ${experience}
    Sprzęt: ${equipment}
    
    Oto lista DOSTĘPNYCH ćwiczeń w bazie danych:
    ${exercisesListText}
    
    ZASADA KRYTYCZNA: Wybieraj ćwiczenia WYŁĄCZNIE z powyższej listy dostępnych ćwiczeń. Nie wymyślaj własnych.
    
    Zwróć wynik jako czystą tablicę JSON, w formacie:
    [
      { "exercise_id": "TUTAJ_WKLEJ_ID_Z_LISTY", "name": "Nazwa ćwiczenia z listy", "target_sets": 3, "target_reps": "8-12", "rest_time": 90 }
    ]`;

    console.log(
      "Wysyłanie zapytania do modelu z listą",
      availableExercises.length,
      "ćwiczeń...",
    );
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text);
  } catch (error) {
    console.error("Błąd podczas generowania planu z AI:", error);
    throw new Error("Nie udało się wygenerować planu.");
  }
};
