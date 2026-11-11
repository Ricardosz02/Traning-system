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
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

type Goal = "Hipertrofia" | "Siła" | "Redukcja";
type Experience = "Początkujący" | "Średniozaawansowany" | "Zaawansowany";
type Equipment =
  "Siłownia (Pełny sprzęt)" | "Kalistenika (Drążek/Poręcze)" | "Tylko Hantle";

export default function AiGeneratorScreen() {
  const navigation = useNavigation<any>();

  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

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
      style={[
        styles.optionButton,
        { backgroundColor: theme.surface, borderColor: theme.border },
        isSelected && {
          borderColor: theme.primary,
          backgroundColor: theme.badgeBg,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionText,
          { color: theme.text },
          isSelected && { color: theme.primary, fontWeight: "bold" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: theme.textMuted, fontSize: 16 }}>Anuluj</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Kreator Planu AI
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            1. Jaki jest Twój główny cel?
          </Text>
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
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            2. Twój poziom zaawansowania?
          </Text>
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
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            3. Dostępny sprzęt?
          </Text>
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
            { backgroundColor: "#2845eb" },
            (!selectedGoal ||
              !selectedExperience ||
              !selectedEquipment ||
              isLoading) && { backgroundColor: theme.border, opacity: 0.7 },
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
            <Text
              style={[styles.generateButtonText, { color: theme.primaryText }]}
            >
              Generuj Plan z AI
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    marginLeft: 5,
  },
  optionButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
  },
  optionText: { fontSize: 16, textAlign: "center", fontWeight: "500" },
  generateButton: {
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  generateButtonText: { fontSize: 18, fontWeight: "bold" },
});
