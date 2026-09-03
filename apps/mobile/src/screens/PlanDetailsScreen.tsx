import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { fetchPlanDetails } from "../services/planService";
import { AppStackParamList } from "../types/navigation.types";
import { useWorkoutStore } from "../store/workoutStore";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";

type PlanDetailsRouteProp = RouteProp<AppStackParamList, "PlanDetails">;

const DAY_NAMES: Record<number, string> = {
  1: "Poniedziałek",
  2: "Wtorek",
  3: "Środa",
  4: "Czwartek",
  5: "Piątek",
  6: "Sobota",
  7: "Niedziela",
};

const getYoutubeVideoId = (url?: string) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const PlanDetailsScreen = () => {
  const route = useRoute<PlanDetailsRouteProp>();
  const navigation = useNavigation();
  const { planId } = route.params;

  const [loading, setLoading] = useState(true);
  const [exercisesByDay, setExercisesByDay] = useState<Record<number, any[]>>(
    {},
  );

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");

  const { startWorkoutFromPlan, isActive } = useWorkoutStore();

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await fetchPlanDetails(planId);

        const grouped = data.reduce((acc: Record<number, any[]>, curr: any) => {
          const day = curr.day_of_week;
          if (!acc[day]) acc[day] = [];
          acc[day].push(curr);
          return acc;
        }, {});

        setExercisesByDay(grouped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [planId]);

  const handleStartWorkout = (day: number) => {
    if (isActive) {
      Alert.alert(
        "Trening w toku",
        "Masz już aktywny trening. Zakończ go przed rozpoczęciem nowego.",
      );
      return;
    }

    const dayExercises = exercisesByDay[day];

    const mappedExercises = dayExercises.map((item) => ({
      exerciseId: item.exercise_id,
      name: item.exercise?.name || "Nieznane ćwiczenie",
      targetSets: item.target_sets || 3,
    }));
    startWorkoutFromPlan(mappedExercises);
    // @ts-ignore
    navigation.navigate("MainTabs", { screen: "Trening" });
  };

  const handleExerciseClick = (exercise: any) => {
    const videoId = getYoutubeVideoId(exercise.exercise?.video_url);
    if (videoId) {
      setActiveVideoTitle(exercise.exercise?.name || "Ćwiczenie");
      setActiveVideoId(videoId);
    } else {
      Alert.alert(
        "Brak instrukcji",
        "To ćwiczenie nie ma jeszcze przypisanego wideo instruktażowego.",
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#17a2b8" />
      </View>
    );
  }

  const activeDays = Object.keys(exercisesByDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {activeDays.length === 0 ? (
          <Text style={styles.emptyText}>
            Ten plan nie ma przypisanych żadnych ćwiczeń.
          </Text>
        ) : (
          activeDays.map((day) => (
            <View key={day} style={styles.dayContainer}>
              <Text style={styles.dayTitle}>{DAY_NAMES[day]}</Text>

              {exercisesByDay[day].map((item, index) => {
                const hasVideo = !!getYoutubeVideoId(item.exercise?.video_url);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.exerciseRow}
                    onPress={() => handleExerciseClick(item)}
                  >
                    <View style={styles.orderCircle}>
                      <Text style={styles.orderText}>{index + 1}</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>
                        {item.exercise?.name || "Nieznane ćwiczenie"}
                      </Text>
                      <Text style={styles.exerciseDetails}>
                        Serie: {item.target_sets} | Powtórzenia:{" "}
                        {item.target_reps || "Brak"}
                      </Text>
                    </View>
                    {hasVideo && (
                      <Ionicons
                        name="play-circle"
                        size={28}
                        color="#e11d48"
                        style={{ marginLeft: 10 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.startButton}
                onPress={() => handleStartWorkout(day)}
              >
                <Text style={styles.startButtonText}>Rozpocznij trening</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={activeVideoId !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeVideoTitle}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 15 },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 40,
    fontSize: 16,
  },
  dayContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 5,
  },
  orderCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  orderText: { color: "#0284c7", fontWeight: "bold", fontSize: 14 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  exerciseDetails: { fontSize: 13, color: "#666", marginTop: 2 },
  startButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  startButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },
  videoWrapper: { width: "100%", backgroundColor: "#000" },
});
