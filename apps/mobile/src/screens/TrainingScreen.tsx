import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useWorkoutStore } from "../store/workoutStore";
import { SetRow } from "../components/SetRow";
import { ExerciseSelectorModal } from "../components/ExerciseSelectorModal";
import { useAuth } from "../contexts/AuthContext";
import { saveWorkoutSession } from "../services/workoutService";
import {
  fetchUserDashboardData,
  fetchCustomUserPlans,
  fetchCustomWorkoutItems,
} from "../services/planService";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";

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

interface DashboardPlan {
  planId: string;
  planName: string;
  day: number;
  exercises: any[];
  isCustom: boolean;
}

export const TrainingScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const {
    isActive,
    startTime,
    startWorkout,
    startWorkoutFromPlan,
    endWorkout,
    exercises,
    addSet,
  } = useWorkoutStore();

  const [isModalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  const [todayPlans, setTodayPlans] = useState<DashboardPlan[]>([]);
  const [otherPlans, setOtherPlans] = useState<DashboardPlan[]>([]);

  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");

  const currentJsDay = new Date().getDay();
  const currentDayOfWeek = currentJsDay === 0 ? 7 : currentJsDay;

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!isActive && user) {
        loadDashboardData();
      }
    });
    return unsubscribe;
  }, [navigation, isActive, user]);

  useEffect(() => {
    if (isActive && exercises.length > 0) {
      loadVideoUrlsForExercises();
    }
  }, [isActive, exercises.length]);

  const loadVideoUrlsForExercises = async () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const validIds = exercises
      .map((ex) => (ex as any).exerciseId || ex.id)
      .filter((id) => id && uuidRegex.test(id));

    if (validIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, video_url")
        .in("id", validIds)
        .not("video_url", "is", null);

      if (error) throw error;

      const urlsMapping: Record<string, string> = {};
      data?.forEach((row) => {
        if (row.video_url) urlsMapping[row.id] = row.video_url;
      });
      setVideoUrls(urlsMapping);
    } catch (error) {
      console.error("Błąd pobierania linków wideo:", error);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;
    setIsLoadingDashboard(true);
    try {
      const standardData = await fetchUserDashboardData(user.id);

      const customPlans = await fetchCustomUserPlans(user.id);

      const todayTemp: DashboardPlan[] = [];
      const otherTemp: DashboardPlan[] = [];

      standardData?.forEach((plan) => {
        const days = [
          ...new Set(plan.plan_exercises.map((pe: any) => pe.day_of_week)),
        ];

        if (days.includes(currentDayOfWeek)) {
          todayTemp.push({
            planId: plan.id,
            planName: plan.name,
            day: currentDayOfWeek,
            exercises: plan.plan_exercises.filter(
              (pe: any) => pe.day_of_week === currentDayOfWeek,
            ),
            isCustom: false,
          });
        }

        days.forEach((day) => {
          if (day !== currentDayOfWeek) {
            otherTemp.push({
              planId: plan.id,
              planName: plan.name,
              day: day as number,
              exercises: plan.plan_exercises.filter(
                (pe: any) => pe.day_of_week === day,
              ),
              isCustom: false,
            });
          }
        });
      });

      for (const customPlan of customPlans) {
        const items = await fetchCustomWorkoutItems(customPlan.id);

        if (items && items.length > 0) {
          const days = [...new Set(items.map((pe: any) => pe.day_of_week))];

          if (days.includes(currentDayOfWeek)) {
            todayTemp.push({
              planId: customPlan.id,
              planName: customPlan.name,
              day: currentDayOfWeek,
              exercises: items.filter(
                (pe: any) => pe.day_of_week === currentDayOfWeek,
              ),
              isCustom: true,
            });
          }

          days.forEach((day) => {
            if (day !== currentDayOfWeek) {
              otherTemp.push({
                planId: customPlan.id,
                planName: customPlan.name,
                day: day as number,
                exercises: items.filter((pe: any) => pe.day_of_week === day),
                isCustom: true,
              });
            }
          });
        }
      }

      setTodayPlans(todayTemp);
      setOtherPlans(otherTemp);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const handleStartFromDashboard = (
    planExercises: any[],
    isCustom: boolean,
  ) => {
    const mapped = planExercises.map((item) => {
      if (isCustom) {
        return {
          exerciseId: item.id,
          name: item.exercise_name,
          targetSets: parseInt(item.sets) || 3,
          videoUrl: item.video_url,
        };
      } else {
        return {
          exerciseId: item.exercise_id,
          name: item.exercise?.name || "Nieznane ćwiczenie",
          targetSets: item.target_sets || 3,
        };
      }
    });

    startWorkoutFromPlan(mapped);
  };

  const handleFinishWorkout = async () => {
    if (!user?.id) {
      Alert.alert("Błąd", "Nie znaleziono użytkownika.");
      return;
    }
    if (!startTime || exercises.length === 0) {
      Alert.alert("Uwaga", "Trening jest pusty lub wystąpił błąd czasu.");
      return;
    }

    setIsSaving(true);
    try {
      await saveWorkoutSession(
        user.id,
        startTime.toISOString(),
        new Date().toISOString(),
        exercises,
      );
      Alert.alert("Sukces", "Trening został zapisany!");
      endWorkout();
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const playExerciseVideo = (exerciseId: string, exerciseName: string) => {
    const videoUrl = videoUrls[exerciseId];
    const videoId = getYoutubeVideoId(videoUrl);
    if (videoId) {
      setActiveVideoTitle(exerciseName);
      setActiveVideoId(videoId);
    }
  };

  if (!isActive) {
    if (isLoadingDashboard) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#17a2b8" />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.dashboardContainer}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.dashboardTitle}>Gotowy na trening?</Text>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            Dzisiejszy plan ({DAY_NAMES[currentDayOfWeek]})
          </Text>
          {todayPlans.length > 0 ? (
            todayPlans.map((tp) => (
              <View
                key={`${tp.planId}-${tp.day}`}
                style={[
                  styles.todayCard,
                  tp.isCustom && styles.customTodayCard,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.todayCardTitle}>{tp.planName}</Text>
                  {tp.isCustom && (
                    <Text style={styles.privateBadgeTextSmall}>🔒 Własny</Text>
                  )}
                </View>
                <Text style={styles.todayCardDesc}>
                  {tp.exercises.length} ćwiczeń zaplanowanych na dzisiaj.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.startTodayButton,
                    tp.isCustom && styles.customStartBtn,
                  ]}
                  onPress={() =>
                    handleStartFromDashboard(tp.exercises, tp.isCustom)
                  }
                >
                  <Text style={styles.startTodayText}>
                    Rozpocznij {DAY_NAMES[currentDayOfWeek]}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.restDayCard}>
              <Text style={styles.restDayTitle}>Dzień wolny!</Text>
              <Text style={styles.restDayDesc}>
                Nie masz dzisiaj w harmonogramie żadnego planu. Odpoczywaj lub
                wybierz inny dzień z listy poniżej.
              </Text>
            </View>
          )}
        </View>

        {otherPlans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>
              Wybierz inny dzień (Alternatywa)
            </Text>
            {otherPlans.map((op, index) => (
              <TouchableOpacity
                key={`${op.planId}-${op.day}-${index}`}
                style={[
                  styles.otherCard,
                  op.isCustom && styles.customOtherCard,
                ]}
                onPress={() =>
                  handleStartFromDashboard(op.exercises, op.isCustom)
                }
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.otherCardTitle}>{op.planName}</Text>
                    {op.isCustom && (
                      <Text style={styles.privateBadgeTextSmall}>🔒</Text>
                    )}
                  </View>
                  <Text style={styles.otherCardDesc}>
                    {DAY_NAMES[op.day]} • {op.exercises.length} ćwiczeń
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>➔</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.freeWorkoutButton}
          onPress={startWorkout}
        >
          <Text style={styles.freeWorkoutText}>
            Rozpocznij pusty trening (bez planu)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Trening w toku</Text>
          <TouchableOpacity
            style={[styles.dangerButton, isSaving && styles.disabledButton]}
            onPress={handleFinishWorkout}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Zakończ i zapisz</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.workoutArea}>
          {exercises.length === 0 ? (
            <Text style={styles.emptyText}>
              Brak ćwiczeń. Dodaj pierwsze ćwiczenie!
            </Text>
          ) : (
            exercises.map((ex) => {
              const realDbId = (ex as any).exerciseId || ex.id;
              const directVideoUrl = (ex as any).videoUrl;
              const hasVideo = !!videoUrls[realDbId] || !!directVideoUrl;

              return (
                <View key={ex.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    {hasVideo && (
                      <TouchableOpacity
                        onPress={() => {
                          const urlToPlay =
                            directVideoUrl || videoUrls[realDbId];
                          const vId = getYoutubeVideoId(urlToPlay);
                          if (vId) {
                            setActiveVideoTitle(ex.name);
                            setActiveVideoId(vId);
                          } else {
                            Alert.alert(
                              "Błąd",
                              "Nie udało się rozpoznać linku YouTube.",
                            );
                          }
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

                  <View style={styles.columnHeaders}>
                    <Text style={styles.headerText}>Seria</Text>
                    <Text style={styles.headerText}>Kg</Text>
                    <Text style={styles.headerText}>Powt.</Text>
                    <Text style={styles.headerText}>RPE</Text>
                    <Text style={styles.headerText}>✔</Text>
                  </View>

                  {ex.sets.map((set, index) => (
                    <SetRow
                      key={set.id}
                      exerciseId={ex.id}
                      item={set}
                      index={index}
                    />
                  ))}

                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={() => addSet(ex.id)}
                  >
                    <Text style={styles.addSetText}>+ Dodaj serię</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.secondaryButtonText}>
              + Dodaj dodatkowe ćwiczenie
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ExerciseSelectorModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      <Modal visible={activeVideoId !== null} animationType="fade" transparent>
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
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingTop: 50 },

  dashboardContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
    paddingTop: 60,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 25,
  },
  section: { marginBottom: 25 },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6c757d",
    marginBottom: 12,
    textTransform: "uppercase",
  },

  todayCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: "#17a2b8",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customTodayCard: {
    borderLeftColor: "#f39c12",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  privateBadgeTextSmall: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#856404",
    backgroundColor: "#fff3cd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
    overflow: "hidden",
  },

  todayCardTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  todayCardDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    marginBottom: 15,
  },
  startTodayButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  customStartBtn: {
    backgroundColor: "#343a40",
  },
  startTodayText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  restDayCard: {
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  restDayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#495057",
    marginBottom: 5,
  },
  restDayDesc: { fontSize: 14, color: "#6c757d", textAlign: "center" },

  otherCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  customOtherCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#f39c12",
  },
  otherCardTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  otherCardDesc: { fontSize: 13, color: "#666", marginTop: 3 },
  arrowIcon: { fontSize: 20, color: "#adb5bd" },

  divider: { height: 1, backgroundColor: "#dee2e6", marginVertical: 15 },
  freeWorkoutButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  freeWorkoutText: { color: "#495057", fontWeight: "bold", fontSize: 15 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#333" },
  dangerButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  secondaryButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    margin: 20,
  },
  secondaryButtonText: { color: "#333", fontWeight: "bold", fontSize: 16 },
  workoutArea: { flex: 1 },
  emptyText: { textAlign: "center", color: "#666", marginTop: 50 },

  exerciseCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  exerciseName: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },

  columnHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  headerText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "bold",
    width: 40,
    textAlign: "center",
  },
  addSetButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  addSetText: { color: "#17a2b8", fontWeight: "bold" },

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
