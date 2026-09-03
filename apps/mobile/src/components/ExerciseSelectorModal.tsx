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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";
import {
  fetchExercises,
  updateExerciseVideoUrl,
  Exercise,
} from "../services/exerciseService";
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

const getYoutubeVideoId = (url?: string) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const ExerciseSelectorModal = ({
  visible,
  onClose,
  onSelect,
}: Props) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("Wszystkie");

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");

  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);

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

  const openUrlEditor = (exercise: Exercise) => {
    setEditingExercise(exercise);
    // @ts-ignore
    setVideoUrlInput(exercise.video_url || "");
    setUrlModalVisible(true);
  };

  const saveVideoUrl = async () => {
    if (!editingExercise) return;
    setIsUpdatingUrl(true);
    try {
      await updateExerciseVideoUrl(editingExercise.id, videoUrlInput.trim());

      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === editingExercise.id
            ? { ...ex, video_url: videoUrlInput.trim() }
            : ex,
        ),
      );

      setUrlModalVisible(false);
    } catch (error: any) {
      Alert.alert("Błąd", error.message || "Nie udało się zapisać linku.");
    } finally {
      setIsUpdatingUrl(false);
    }
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
              renderItem={({ item }) => {
                // @ts-ignore
                const videoId = getYoutubeVideoId(item.video_url);

                return (
                  <View style={styles.itemWrapper}>
                    <TouchableOpacity
                      style={styles.itemInfo}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemCategory}>
                        {item.category} •{" "}
                        {item.muscle_group ? item.muscle_group.join(", ") : ""}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openUrlEditor(item)}
                      >
                        <Ionicons name="link" size={24} color="#adb5bd" />
                      </TouchableOpacity>

                      {videoId && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => {
                            setActiveVideoTitle(item.name);
                            setActiveVideoId(videoId);
                          }}
                        >
                          <Ionicons
                            name="play-circle"
                            size={32}
                            color="#e11d48"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        <Modal visible={urlModalVisible} animationType="fade" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Dodaj wideo</Text>
              <Text style={styles.modalSubtitle}>{editingExercise?.name}</Text>

              <TextInput
                style={styles.urlInput}
                placeholder="Wklej link z YouTube..."
                value={videoUrlInput}
                onChangeText={setVideoUrlInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setUrlModalVisible(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelText}>Anuluj</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveVideoUrl}
                  style={styles.modalSaveBtn}
                  disabled={isUpdatingUrl}
                >
                  {isUpdatingUrl ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalSaveText}>Zapisz</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={activeVideoId !== null}
          animationType="fade"
          transparent
        >
          <View style={styles.videoOverlay}>
            <View style={styles.videoContent}>
              <View style={styles.videoHeader}>
                <Text style={styles.videoTitle} numberOfLines={1}>
                  {activeVideoTitle}
                </Text>
                <TouchableOpacity onPress={() => setActiveVideoId(null)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              {activeVideoId && (
                <View style={styles.videoWrapper}>
                  <YoutubePlayer
                    height={220}
                    play={true}
                    videoId={activeVideoId}
                  />
                </View>
              )}
            </View>
          </View>
        </Modal>
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

  itemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemInfo: { flex: 1 },
  actionsContainer: { flexDirection: "row", alignItems: "center" },
  actionBtn: { paddingLeft: 12, justifyContent: "center" },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  urlInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end" },
  modalCancelBtn: { padding: 10, marginRight: 10 },
  modalCancelText: { color: "#666", fontWeight: "bold", fontSize: 16 },
  modalSaveBtn: {
    backgroundColor: "#17a2b8",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  modalSaveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  videoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContent: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 12,
    overflow: "hidden",
  },
  videoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    paddingRight: 10,
  },
  videoWrapper: { width: "100%", backgroundColor: "#000" },
});
