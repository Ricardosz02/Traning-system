import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { createCustomWorkoutPlan } from "../services/planService";
import { ActivityIndicator } from "react-native";

const DAYS = [
  { id: 1, name: "Pon" },
  { id: 2, name: "Wto" },
  { id: 3, name: "Śro" },
  { id: 4, name: "Czw" },
  { id: 5, name: "Pią" },
  { id: 6, name: "Sob" },
  { id: 7, name: "Nie" },
];

interface ExerciseItem {
  id: string;
  exercise_name: string;
  sets: string;
  reps: string;
  video_url: string;
  day_of_week: number;
}

export const WorkoutCreatorScreen = () => {
  const navigation = useNavigation();
  const [workoutName, setWorkoutName] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const addExerciseRow = () => {
    setExercises([
      ...exercises,
      {
        id: Math.random().toString(),
        exercise_name: "",
        sets: "",
        reps: "",
        video_url: "",
        day_of_week: selectedDay,
      },
    ]);
  };

  const updateExercise = (
    id: string,
    field: keyof ExerciseItem,
    value: string,
  ) => {
    setExercises(
      exercises.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeExerciseRow = (id: string) => {
    setExercises(exercises.filter((item) => item.id !== id));
  };

  const handleSavePlan = async () => {
    if (!user?.id) return;
    if (!workoutName.trim()) {
      Alert.alert("Błąd", "Podaj nazwę planu.");
      return;
    }
    if (exercises.length === 0) {
      Alert.alert("Błąd", "Dodaj chociaż jedno ćwiczenie.");
      return;
    }

    setIsSaving(true);
    try {
      await createCustomWorkoutPlan(user.id, workoutName, exercises);
      Alert.alert("Sukces", "Twój własny plan został zapisany!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Błąd zapisu", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const visibleExercises = exercises.filter(
    (ex) => ex.day_of_week === selectedDay,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Anuluj</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Własny Plan</Text>
        <TouchableOpacity onPress={handleSavePlan} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#17a2b8" />
          ) : (
            <Text style={styles.saveText}>Zapisz</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.label}>Nazwa planu *</Text>
          <TextInput
            style={styles.inputTitle}
            placeholder="np. Moje FBW Własne"
            value={workoutName}
            onChangeText={setWorkoutName}
          />

          <Text style={styles.sectionTitle}>Harmonogram tygodniowy</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daysScroll}
          >
            {DAYS.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayBadge,
                  selectedDay === day.id && styles.dayBadgeActive,
                ]}
                onPress={() => setSelectedDay(day.id)}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDay === day.id && styles.dayTextActive,
                  ]}
                >
                  {day.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.dayContainer}>
            <Text style={styles.dayTitle}>
              Ćwiczenia - {DAYS.find((d) => d.id === selectedDay)?.name}
            </Text>

            {visibleExercises.length === 0 && (
              <Text style={styles.emptyText}>
                Brak ćwiczeń. Dodaj nowe poniżej.
              </Text>
            )}

            {visibleExercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeaderRow}>
                  <Text style={styles.exerciseHeader}>
                    Ćwiczenie {index + 1}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeExerciseRow(exercise.id)}
                  >
                    <Text style={styles.deleteText}>X Usuń</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Nazwa (np. Wyciskanie na płaskiej)"
                  value={exercise.exercise_name}
                  onChangeText={(text) =>
                    updateExercise(exercise.id, "exercise_name", text)
                  }
                />

                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Serie (np. 4)"
                    value={exercise.sets}
                    onChangeText={(text) =>
                      updateExercise(exercise.id, "sets", text)
                    }
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Powtórzenia (np. 8-12)"
                    value={exercise.reps}
                    onChangeText={(text) =>
                      updateExercise(exercise.id, "reps", text)
                    }
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Link do wideo YouTube (opcjonalnie)"
                  value={exercise.video_url}
                  onChangeText={(text) =>
                    updateExercise(exercise.id, "video_url", text)
                  }
                  autoCapitalize="none"
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addExerciseRow}>
              <Text style={styles.addButtonText}>+ Dodaj ćwiczenie</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  cancelText: { color: "#666", fontSize: 16 },
  title: { fontSize: 18, fontWeight: "bold", color: "#333" },
  saveText: { color: "#17a2b8", fontSize: 16, fontWeight: "bold" },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 8 },
  inputTitle: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  daysScroll: { flexDirection: "row", marginBottom: 20 },
  dayBadge: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#e9ecef",
    borderRadius: 20,
    marginRight: 10,
  },
  dayBadgeActive: { backgroundColor: "#17a2b8" },
  dayText: { color: "#495057", fontWeight: "bold" },
  dayTextActive: { color: "#fff" },
  dayContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    minHeight: 250,
    marginBottom: 30,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  emptyText: {
    color: "#999",
    fontStyle: "italic",
    marginBottom: 20,
    textAlign: "center",
  },
  exerciseCard: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  exerciseHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  exerciseHeader: { fontWeight: "bold", color: "#333" },
  deleteText: { color: "red", fontWeight: "bold", fontSize: 13 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },
  halfInput: { width: "48%" },
  addButton: {
    padding: 14,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  addButtonText: { color: "#00838f", fontWeight: "bold", fontSize: 15 },
});
