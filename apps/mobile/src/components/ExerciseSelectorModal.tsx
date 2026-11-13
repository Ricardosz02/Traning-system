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
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

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
  Klatka: [
    "chest",
    "pectoral",
    "klatk",
    "piersiow",
    "wyciskanie leżąc",
    "wyciskanie sztangi na ławce",
    "wyciskanie hantli na ławce",
    "rozpiętki",
    "pompki",
    "dipy",
  ],
  Plecy: [
    "back",
    "lats",
    "latissimus",
    "traps",
    "rhomboid",
    "erector",
    "plec",
    "grzbiet",
    "najszersz",
    "kaptur",
    "lędźw",
    "podciąganie",
    "wiosłowanie",
    "ściąganie drążka",
    "martwy ciąg",
  ],
  Nogi: [
    "legs",
    "upper legs",
    "lower legs",
    "quad",
    "hamstring",
    "calves",
    "calf",
    "glute",
    "nog",
    "udo",
    "uda",
    "czworogłow",
    "dwugłow",
    "łydk",
    "poślad",
    "przysiad",
    "wykrok",
    "suwnic",
    "prostowanie nóg",
    "uginanie nóg",
    "wspięcia",
    "hip thrust",
  ],
  Barki: [
    "shoulder",
    "delt",
    "bark",
    "naramien",
    "żołnierskie",
    "ohp",
    "wznosy bokiem",
    "wznosy przodem",
    "face pull",
  ],
  Biceps: [
    "bicep",
    "dwugłowy ramienia",
    "uginanie ramion",
    "modlitewnik",
    "młotkow",
  ],
  Triceps: [
    "tricep",
    "trójgłowy",
    "francusk",
    "prostowanie ramion",
    "wyciskanie wąsko",
  ],
  Brzuch: [
    "core",
    "abs",
    "abdomin",
    "oblique",
    "brzuch",
    "skośn",
    "plank",
    "deska",
    "allahy",
    "unoszenie nóg",
  ],
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
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

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
    return exercises.filter((ex: any) => {
      const matchesSearch = ex.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase().trim());

      if (!matchesSearch) return false;
      if (selectedMuscle === "Wszystkie") return true;

      const keywords = MUSCLE_GROUP_MAPPING[selectedMuscle] || [
        selectedMuscle.toLowerCase(),
      ];

      const muscles: string[] =
        Array.isArray(ex.target_muscles) && ex.target_muscles.length > 0
          ? ex.target_muscles
          : Array.isArray(ex.muscle_group)
            ? ex.muscle_group
            : [];

      const pool = muscles.length > 0 ? muscles : [ex.name || ""];

      return pool.some((tag) =>
        keywords.some((keyword) =>
          tag.toLowerCase().includes(keyword.toLowerCase()),
        ),
      );
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
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.surface,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              Wybierz ćwiczenie
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: theme.danger }]}>
                Anuluj
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Szukaj (np. wyciskanie)..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.textMuted}
                />
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
              renderItem={({ item }) => {
                const isSelected = selectedMuscle === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedMuscle(item)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: isSelected
                            ? theme.primaryText
                            : theme.textMuted,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList<Exercise>
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              // @ts-ignore
              contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  {searchQuery
                    ? `Brak wyników dla "${searchQuery}"`
                    : `Brak ćwiczeń w kategorii "${selectedMuscle}"`}
                </Text>
              }
              renderItem={({ item }) => {
                // @ts-ignore
                const videoId = getYoutubeVideoId(item.video_url);
                const rawMuscles =
                  Array.isArray((item as any).target_muscles) &&
                  (item as any).target_muscles.length > 0
                    ? (item as any).target_muscles
                    : item.muscle_group;

                const musclesLabel = Array.isArray(rawMuscles)
                  ? rawMuscles.join(", ")
                  : rawMuscles || "";

                return (
                  <View
                    style={[
                      styles.itemWrapper,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.itemInfo}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={[styles.itemName, { color: theme.text }]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.itemCategory,
                          { color: theme.textMuted },
                        ]}
                      >
                        {item.category}
                        {musclesLabel ? ` • ${musclesLabel}` : ""}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openUrlEditor(item)}
                      >
                        <Ionicons
                          name="link"
                          size={24}
                          color={theme.textMuted}
                        />
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
            <View
              style={[styles.modalContent, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Dodaj wideo
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                {editingExercise?.name}
              </Text>

              <TextInput
                style={[
                  styles.urlInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="Wklej link z YouTube..."
                placeholderTextColor={theme.textMuted}
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
                  <Text
                    style={[styles.modalCancelText, { color: theme.textMuted }]}
                  >
                    Anuluj
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveVideoUrl}
                  style={[
                    styles.modalSaveBtn,
                    { backgroundColor: theme.primary },
                  ]}
                  disabled={isUpdatingUrl}
                >
                  {isUpdatingUrl ? (
                    <ActivityIndicator size="small" color={theme.primaryText} />
                  ) : (
                    <Text
                      style={[
                        styles.modalSaveText,
                        { color: theme.primaryText },
                      ]}
                    >
                      Zapisz
                    </Text>
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
            <View
              style={[styles.videoContent, { backgroundColor: theme.surface }]}
            >
              <View
                style={[
                  styles.videoHeader,
                  { borderBottomColor: theme.border },
                ]}
              >
                <Text
                  style={[styles.videoTitle, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {activeVideoTitle}
                </Text>
                <TouchableOpacity onPress={() => setActiveVideoId(null)}>
                  <Ionicons name="close" size={28} color={theme.text} />
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
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  closeButton: { padding: 5 },
  closeText: { fontWeight: "bold" },

  itemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemInfo: { flex: 1 },
  actionsContainer: { flexDirection: "row", alignItems: "center" },
  actionBtn: { paddingLeft: 12, justifyContent: "center" },

  itemName: { fontSize: 16, fontWeight: "bold" },
  itemCategory: { fontSize: 13, marginTop: 4 },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 45,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  filtersContainer: { paddingLeft: 15, marginBottom: 10, maxHeight: 40 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    justifyContent: "center",
  },
  filterText: { fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  urlInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end" },
  modalCancelBtn: { padding: 10, marginRight: 10 },
  modalCancelText: { fontWeight: "bold", fontSize: 16 },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  modalSaveText: { fontWeight: "bold", fontSize: 16 },

  videoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContent: {
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
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    paddingRight: 10,
  },
  videoWrapper: { width: "100%", backgroundColor: "#000" },
});
