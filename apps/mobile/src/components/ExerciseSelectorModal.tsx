import React, { useEffect, useState } from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { fetchExercises, Exercise } from "../services/exerciseService";
import { useWorkoutStore } from "../store/workoutStore";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect?: (exercise: Exercise) => void; 
}

export const ExerciseSelectorModal = ({ visible, onClose, onSelect }: Props) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  const addExercise = useWorkoutStore((state) => state.addExercise);

  useEffect(() => {
    if (visible) {
      loadCatalog();
    }
  }, [visible]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await fetchExercises();
      setExercises(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (exercise: Exercise) => {
    if (onSelect) {
      onSelect(exercise);
    } else {
      addExercise(exercise.id, exercise.name);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Wybierz ćwiczenie</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Anuluj</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#17a2b8" style={{ marginTop: 20 }} />
        ) : (
          <FlatList<Exercise>
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>
                  {item.category} • {item.muscle_group.join(", ")}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 18, fontWeight: "bold" },
  closeButton: { padding: 5 },
  closeText: { color: "#dc3545", fontWeight: "bold" },
  item: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2 },
  itemName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  itemCategory: { fontSize: 13, color: "#666", marginTop: 4 },
});