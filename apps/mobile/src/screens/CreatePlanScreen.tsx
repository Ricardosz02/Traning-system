import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { createPlanWithExercises } from "../services/planService";
import { ExerciseSelectorModal } from "../components/ExerciseSelectorModal";
import { Exercise } from "../services/exerciseService";

interface DraftExercise {
  exercise_id: string;
  name: string;
  day_of_week: number;
  target_sets: number;
  target_reps: string;
}

const DAYS = [
  { id: 1, name: "Pon" },
  { id: 2, name: "Wto" },
  { id: 3, name: "Śro" },
  { id: 4, name: "Czw" },
  { id: 5, name: "Pią" },
  { id: 6, name: "Sob" },
  { id: 7, name: "Nie" },
];

export const CreatePlanScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [draftExercises, setDraftExercises] = useState<DraftExercise[]>([]);

  const [isModalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSets, setEditSets] = useState("3");
  const [editReps, setEditReps] = useState("8-12");

  const handleAddExercise = (exercise: Exercise) => {
    setDraftExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        day_of_week: selectedDay,
        target_sets: 3,
        target_reps: "8-12",
      },
    ]);
  };

  const handleRemoveExercise = (indexToRemove: number) => {
    setDraftExercises((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const openEditModal = (index: number) => {
    const ex = draftExercises[index];
    setEditSets(ex.target_sets.toString());
    setEditReps(ex.target_reps);
    setEditingIndex(index);
  };

  const saveExerciseEdit = () => {
    if (editingIndex === null) return;

    const parsedSets = parseInt(editSets);
    if (isNaN(parsedSets) || parsedSets <= 0) {
      Alert.alert("Błąd", "Liczba serii musi być większa od 0.");
      return;
    }
    if (!editReps.trim()) {
      Alert.alert("Błąd", "Podaj zakres powtórzeń (np. 8-12).");
      return;
    }

    setDraftExercises((prev) => {
      const updated = [...prev];
      updated[editingIndex] = {
        ...updated[editingIndex],
        target_sets: parsedSets,
        target_reps: editReps.trim(),
      };
      return updated;
    });
    setEditingIndex(null);
  };

  const handleSavePlan = async () => {
    if (!user?.id) return;
    if (!planName.trim()) {
      Alert.alert("Błąd", "Podaj nazwę planu treningowego.");
      return;
    }
    if (draftExercises.length === 0) {
      Alert.alert("Błąd", "Dodaj przynajmniej jedno ćwiczenie do planu.");
      return;
    }

    setIsSaving(true);
    try {
      const exercisesByDay = draftExercises.reduce(
        (acc, curr) => {
          const day = curr.day_of_week;
          if (!acc[day]) acc[day] = [];
          acc[day].push(curr);
          return acc;
        },
        {} as Record<number, DraftExercise[]>,
      );

      const finalExercises: Array<{
        exercise_id: string;
        day_of_week: number;
        target_sets: number;
        target_reps: string;
        order_in_day: number;
      }> = [];

      Object.values(exercisesByDay).forEach((dayExercises) => {
        dayExercises.forEach((ex, index) => {
          finalExercises.push({
            exercise_id: ex.exercise_id,
            day_of_week: ex.day_of_week,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            order_in_day: index + 1,
          });
        });
      });

      await createPlanWithExercises(
        user.id,
        planName,
        description,
        finalExercises,
      );
      Alert.alert("Sukces", "Plan został zapisany!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Błąd zapisu", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const visibleExercises = draftExercises
    .map((ex, idx) => ({ ...ex, originalIndex: idx }))
    .filter((ex) => ex.day_of_week === selectedDay);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Anuluj</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Kreator Planu</Text>
        <TouchableOpacity onPress={handleSavePlan} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#17a2b8" />
          ) : (
            <Text style={styles.saveText}>Zapisz</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nazwa planu *</Text>
          <TextInput
            style={styles.input}
            value={planName}
            onChangeText={setPlanName}
            placeholder="np. FBW 3-dniowy"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Krótki opis</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Opcjonalnie..."
          />
        </View>

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

          {visibleExercises.length === 0 ? (
            <Text style={styles.emptyText}>
              Dzień wolny. Brak zaplanowanych ćwiczeń.
            </Text>
          ) : (
            visibleExercises.map((ex) => (
              <View key={ex.originalIndex} style={styles.exerciseCardWrapper}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => openEditModal(ex.originalIndex)}
                >
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exDetails}>
                    Serie: {ex.target_sets} | Powtórzenia: {ex.target_reps}
                  </Text>
                  <Text style={styles.editHint}>Kliknij, aby edytować</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRemoveExercise(ex.originalIndex)}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeText}>X</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>
              + Dodaj ćwiczenie do{" "}
              {DAYS.find((d) => d.id === selectedDay)?.name}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ExerciseSelectorModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleAddExercise}
      />

      <Modal visible={editingIndex !== null} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edytuj parametry</Text>
            <Text style={styles.modalSubtitle}>
              {editingIndex !== null ? draftExercises[editingIndex]?.name : ""}
            </Text>

            <Text style={styles.label}>Liczba serii</Text>
            <TextInput
              style={styles.input}
              value={editSets}
              onChangeText={setEditSets}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Zakres powtórzeń (np. 8-12)</Text>
            <TextInput
              style={styles.input}
              value={editReps}
              onChangeText={setEditReps}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setEditingIndex(null)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveExerciseEdit}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Zapisz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  content: { padding: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 5 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 10,
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
    minHeight: 200,
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

  exerciseCardWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  exName: { fontSize: 15, fontWeight: "bold", color: "#333" },
  exDetails: { fontSize: 13, color: "#444", marginTop: 4, fontWeight: "500" },
  editHint: { fontSize: 11, color: "#aaa", marginTop: 4 },
  removeBtn: { padding: 10, paddingRight: 0 },
  removeText: { color: "#dc3545", fontWeight: "bold", fontSize: 18 },
  addButton: {
    paddingVertical: 12,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: { color: "#00838f", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  modalCancelBtn: { padding: 10, marginRight: 10 },
  modalCancelText: { color: "#666", fontWeight: "bold", fontSize: 16 },
  modalSaveBtn: {
    backgroundColor: "#17a2b8",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSaveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
