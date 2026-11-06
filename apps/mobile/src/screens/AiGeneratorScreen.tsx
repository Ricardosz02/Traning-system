import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { generateWorkoutPlan } from "../services/aiService";
import { useNavigation } from "@react-navigation/native";
import { fetchExercises } from "../services/exerciseService";

type Goal = "Hipertrofia" | "Siła" | "Redukcja";
type Experience = "Początkujący" | "Średniozaawansowany" | "Zaawansowany";
type Equipment =
  "Siłownia (Pełny sprzęt)" | "Kalistenika (Drążek/Poręcze)" | "Tylko Hantle";

export default function AiGeneratorScreen() {
  const navigation = useNavigation<any>();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedExperience, setSelectedExperience] =
    useState<Experience | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePlan = async () => {
    if (!selectedGoal || !selectedExperience || !selectedEquipment) {
      Alert.alert(
        "Błąd",
        "Proszę zaznaczyć wszystkie opcje przed wygenerowaniem planu.",
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log("Pobieranie listy ćwiczeń z bazy...");
      const exercisesFromDB = await fetchExercises();

      console.log("Wysyłanie danych do Gemini API...");
      const plan = await generateWorkoutPlan(
        selectedGoal,
        selectedExperience,
        selectedEquipment,
        exercisesFromDB,
      );

      navigation.navigate("CreatePlan", {
        generatedPlan: plan,
        isFromAI: true,
      });
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Błąd AI",
        "Nie udało się wygenerować planu. Spróbuj ponownie.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const OptionButton = ({
    label,
    isSelected,
    onPress,
  }: {
    label: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.optionButton, isSelected && styles.optionButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerTitle}>Kreator Planu AI</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Jaki jest Twój główny cel?</Text>
          <OptionButton
            label="Hipertrofia (Budowa masy)"
            isSelected={selectedGoal === "Hipertrofia"}
            onPress={() => setSelectedGoal("Hipertrofia")}
          />
          <OptionButton
            label="Siła (Maksymalizacja ciężaru)"
            isSelected={selectedGoal === "Siła"}
            onPress={() => setSelectedGoal("Siła")}
          />
          <OptionButton
            label="Redukcja (Utrata tkanki tłuszczowej)"
            isSelected={selectedGoal === "Redukcja"}
            onPress={() => setSelectedGoal("Redukcja")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Twój poziom zaawansowania?</Text>
          <OptionButton
            label="Początkujący"
            isSelected={selectedExperience === "Początkujący"}
            onPress={() => setSelectedExperience("Początkujący")}
          />
          <OptionButton
            label="Średniozaawansowany"
            isSelected={selectedExperience === "Średniozaawansowany"}
            onPress={() => setSelectedExperience("Średniozaawansowany")}
          />
          <OptionButton
            label="Zaawansowany"
            isSelected={selectedExperience === "Zaawansowany"}
            onPress={() => setSelectedExperience("Zaawansowany")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Dostępny sprzęt?</Text>
          <OptionButton
            label="Siłownia (Pełny sprzęt)"
            isSelected={selectedEquipment === "Siłownia (Pełny sprzęt)"}
            onPress={() => setSelectedEquipment("Siłownia (Pełny sprzęt)")}
          />
          <OptionButton
            label="Kalistenika (Drążek/Poręcze)"
            isSelected={selectedEquipment === "Kalistenika (Drążek/Poręcze)"}
            onPress={() => setSelectedEquipment("Kalistenika (Drążek/Poręcze)")}
          />
          <OptionButton
            label="Tylko Hantle"
            isSelected={selectedEquipment === "Tylko Hantle"}
            onPress={() => setSelectedEquipment("Tylko Hantle")}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.generateButton,
            (!selectedGoal ||
              !selectedExperience ||
              !selectedEquipment ||
              isLoading) &&
              styles.generateButtonDisabled,
          ]}
          onPress={handleGeneratePlan}
          disabled={
            isLoading ||
            !selectedGoal ||
            !selectedExperience ||
            !selectedEquipment
          }
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generuj Plan z AI</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ccc",
    marginBottom: 10,
  },
  optionButton: {
    backgroundColor: "#2C2C2E",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionButtonActive: { borderColor: "#0A84FF", backgroundColor: "#1A2938" },
  optionText: { color: "#fff", fontSize: 16, textAlign: "center" },
  optionTextActive: { color: "#0A84FF", fontWeight: "bold" },
  generateButton: {
    backgroundColor: "#0A84FF",
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  generateButtonDisabled: { backgroundColor: "#3A3A3C" },
  generateButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
