import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchExercises, Exercise } from "../services/exerciseService";
import { useWorkoutStore } from "../store/workoutStore";

const MUSCLE_GROUPS = [
  "Wszystkie",
  "Klatka",
  "Plecy",
  "Nogi",
  "Barki",
  "Biceps",
  "Triceps",
  "Brzuch",
];

const MUSCLE_GROUP_MAPPING: Record<string, string[]> = {
  Klatka: ["chest"],
  Plecy: ["back", "lats"],
  Nogi: ["legs", "quads", "hamstrings", "calves", "glutes"],
  Barki: ["shoulders", "delts"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  Brzuch: ["core", "abs", "abdominals"],
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect?: (exercise: Exercise) => void;
}

export const ExerciseSelectorModal = ({
  visible,
  onClose,
  onSelect,
}: Props) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("Wszystkie");

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

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      let matchesMuscle = true;
      if (selectedMuscle !== "Wszystkie") {
        const englishKeywords = MUSCLE_GROUP_MAPPING[selectedMuscle] || [];

        matchesMuscle =
          !!ex.muscle_group &&
          ex.muscle_group.some((dbMuscle) =>
            englishKeywords.some((keyword) =>
              dbMuscle.toLowerCase().includes(keyword.toLowerCase()),
            ),
          );
      }

      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, selectedMuscle]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Wybierz ćwiczenie</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Anuluj</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#888"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Szukaj (np. wyciskanie)..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filtersContainer}>
            <FlatList
              horizontal
              // @ts-ignore
              showsHorizontalScrollIndicator={false}
              data={MUSCLE_GROUPS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscle === item && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedMuscle(item)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedMuscle === item && styles.filterTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#17a2b8"
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList<Exercise>
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              // @ts-ignore
              contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Brak wyników dla "{searchQuery}"
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>
                    {item.category} •{" "}
                    {item.muscle_group ? item.muscle_group.join(", ") : ""}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 18, fontWeight: "bold" },
  closeButton: { padding: 5 },
  closeText: { color: "#dc3545", fontWeight: "bold" },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  itemCategory: { fontSize: 13, color: "#666", marginTop: 4 },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#888",
    fontSize: 16,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9ecef",
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 45,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  filtersContainer: { paddingLeft: 15, marginBottom: 10, maxHeight: 40 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 20,
    marginRight: 10,
    justifyContent: "center",
  },
  filterChipActive: { backgroundColor: "#17a2b8" },
  filterText: { color: "#555", fontWeight: "bold" },
  filterTextActive: { color: "#fff" },
});
