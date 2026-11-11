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
  useColorScheme,
  SafeAreaView,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { fetchCustomWorkoutItems } from "../services/planService";
import { AppStackParamList } from "../types/navigation.types";
import { useWorkoutStore } from "../store/workoutStore";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";
import { colors } from "../theme/colors";
import { useThemeStore } from "../store/themeStore";

type CustomPlanDetailsRouteProp = RouteProp<
  AppStackParamList,
  "CustomPlanDetails"
>;

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

export const CustomPlanDetailsScreen = () => {
  const route = useRoute<CustomPlanDetailsRouteProp>();
  const navigation = useNavigation();
  const { planId, planName } = route.params;

  const systemColorScheme = useColorScheme();
  const { isDarkMode: isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;

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
        const data = await fetchCustomWorkoutItems(planId);

        const grouped = (data || []).reduce(
          (acc: Record<number, any[]>, curr: any) => {
            const day = curr.day_of_week;
            if (!acc[day]) acc[day] = [];
            acc[day].push(curr);
            return acc;
          },
          {},
        );

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
      exerciseId: item.id,
      name: item.exercise_name || "Nieznane ćwiczenie",
      targetSets: parseInt(item.sets) || 3,
      videoUrl: item.video_url,
    }));

    startWorkoutFromPlan(mappedExercises);
    // @ts-ignore
    navigation.navigate("MainTabs", { screen: "Trening" });
  };

  const handleExerciseClick = (item: any) => {
    const videoId = getYoutubeVideoId(item.video_url);
    if (videoId) {
      setActiveVideoTitle(item.exercise_name || "Ćwiczenie");
      setActiveVideoId(videoId);
    } else {
      Alert.alert(
        "Brak instrukcji",
        "Nie dodałeś jeszcze wideo instruktażowego do tego ćwiczenia.",
      );
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const activeDays = Object.keys(exercisesByDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {planName || "Twój Plan"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {activeDays.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Ten plan nie ma przypisanych żadnych ćwiczeń.
          </Text>
        ) : (
          activeDays.map((day) => (
            <View
              key={day}
              style={[
                styles.dayContainer,
                {
                  backgroundColor: theme.surface,
                  shadowColor: isDark ? "#000" : "#000",
                },
              ]}
            >
              <Text
                style={[
                  styles.dayTitle,
                  { color: theme.text, borderBottomColor: theme.border },
                ]}
              >
                {DAY_NAMES[day]}
              </Text>

              {exercisesByDay[day].map((item, index) => {
                const hasVideo = !!getYoutubeVideoId(item.video_url);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.exerciseRow}
                    onPress={() => handleExerciseClick(item)}
                  >
                    <View
                      style={[
                        styles.orderCircle,
                        { backgroundColor: theme.badgeBg },
                      ]}
                    >
                      <Text
                        style={[styles.orderText, { color: theme.badgeText }]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text
                        style={[styles.exerciseName, { color: theme.text }]}
                      >
                        {item.exercise_name || "Nieznane ćwiczenie"}
                      </Text>
                      <Text
                        style={[
                          styles.exerciseDetails,
                          { color: theme.textMuted },
                        ]}
                      >
                        Serie: {item.sets || "Brak"} | Powtórzenia:{" "}
                        {item.reps || "Brak"}
                      </Text>
                    </View>
                    {hasVideo && (
                      <Ionicons
                        name="play-circle"
                        size={28}
                        color={theme.primary}
                        style={{ marginLeft: 10 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: theme.primary }]}
                onPress={() => handleStartWorkout(day)}
              >
                <Ionicons
                  name="play"
                  size={18}
                  color={theme.primaryText}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[styles.startButtonText, { color: theme.primaryText }]}
                >
                  Rozpocznij trening
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={activeVideoId !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: theme.border }]}
            >
              <Text
                style={[styles.modalTitle, { color: theme.text }]}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  container: { flex: 1, padding: 15 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  dayContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 4,
  },
  orderCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  orderText: { fontWeight: "bold", fontSize: 14 },
  exerciseInfo: { flex: 1, justifyContent: "center" },
  exerciseName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  exerciseDetails: { fontSize: 13, fontWeight: "500" },
  startButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 15,
  },
  startButtonText: { fontWeight: "bold", fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", flex: 1, marginRight: 10 },
  videoWrapper: { width: "100%", backgroundColor: "#000" },
});
