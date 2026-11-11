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
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { createCustomWorkoutPlan } from "../services/planService";
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

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
  rest_time: string;
  video_url: string;
  day_of_week: number;
}

export const WorkoutCreatorScreen = () => {
  const navigation = useNavigation();

  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

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
        rest_time: "90",
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.cancelText, { color: theme.textMuted }]}>
              Anuluj
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Własny Plan</Text>
          <TouchableOpacity onPress={handleSavePlan} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.saveText, { color: theme.primary }]}>
                Zapisz
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.content}>
            <Text style={[styles.label, { color: theme.text }]}>
              Nazwa planu *
            </Text>
            <TextInput
              style={[
                styles.inputTitle,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="np. Moje FBW Własne"
              placeholderTextColor={theme.textMuted}
              value={workoutName}
              onChangeText={setWorkoutName}
            />

            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Harmonogram tygodniowy
            </Text>

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
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      borderWidth: 1,
                    },
                    selectedDay === day.id && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => setSelectedDay(day.id)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: theme.text },
                      selectedDay === day.id && { color: theme.primaryText },
                    ]}
                  >
                    {day.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View
              style={[styles.dayContainer, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.dayTitle, { color: theme.text }]}>
                Ćwiczenia - {DAYS.find((d) => d.id === selectedDay)?.name}
              </Text>

              {visibleExercises.length === 0 && (
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Brak ćwiczeń. Dodaj nowe poniżej.
                </Text>
              )}

              {visibleExercises.map((exercise, index) => (
                <View
                  key={exercise.id}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.exerciseHeaderRow}>
                    <Text
                      style={[styles.exerciseHeader, { color: theme.text }]}
                    >
                      Ćwiczenie {index + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeExerciseRow(exercise.id)}
                    >
                      <Text
                        style={[styles.deleteText, { color: theme.danger }]}
                      >
                        X Usuń
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Nazwa (np. Wyciskanie na płaskiej)"
                    placeholderTextColor={theme.textMuted}
                    value={exercise.exercise_name}
                    onChangeText={(text) =>
                      updateExercise(exercise.id, "exercise_name", text)
                    }
                  />

                  <View style={styles.row}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.halfInput,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                      placeholder="Serie (np. 4)"
                      placeholderTextColor={theme.textMuted}
                      value={exercise.sets}
                      onChangeText={(text) =>
                        updateExercise(exercise.id, "sets", text)
                      }
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.halfInput,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                      placeholder="Powtórzenia (np. 8-12)"
                      placeholderTextColor={theme.textMuted}
                      value={exercise.reps}
                      onChangeText={(text) =>
                        updateExercise(exercise.id, "reps", text)
                      }
                    />
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Przerwa w sekundach (np. 90)"
                    placeholderTextColor={theme.textMuted}
                    value={exercise.rest_time}
                    onChangeText={(text) =>
                      updateExercise(exercise.id, "rest_time", text)
                    }
                    keyboardType="numeric"
                  />

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Link do wideo YouTube (opcjonalnie)"
                    placeholderTextColor={theme.textMuted}
                    value={exercise.video_url}
                    onChangeText={(text) =>
                      updateExercise(exercise.id, "video_url", text)
                    }
                    autoCapitalize="none"
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.badgeBg }]}
                onPress={addExerciseRow}
              >
                <Text
                  style={[styles.addButtonText, { color: theme.badgeText }]}
                >
                  + Dodaj ćwiczenie
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  cancelText: { fontSize: 16 },
  title: { fontSize: 18, fontWeight: "bold" },
  saveText: { fontSize: 16, fontWeight: "bold" },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  inputTitle: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  daysScroll: { flexDirection: "row", marginBottom: 20 },
  dayBadge: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  dayText: { fontWeight: "bold" },
  dayContainer: {
    padding: 15,
    borderRadius: 10,
    minHeight: 250,
    marginBottom: 30,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  emptyText: {
    fontStyle: "italic",
    marginBottom: 20,
    textAlign: "center",
  },
  exerciseCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  exerciseHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  exerciseHeader: { fontWeight: "bold" },
  deleteText: { fontWeight: "bold", fontSize: 13 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  input: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
  },
  halfInput: { width: "48%" },
  addButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  addButtonText: { fontWeight: "bold", fontSize: 15 },
});
