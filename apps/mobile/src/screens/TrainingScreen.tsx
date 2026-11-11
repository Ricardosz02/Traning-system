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
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useWorkoutStore } from "../store/workoutStore";
import { SetRow } from "../components/SetRow";
import { ExerciseSelectorModal } from "../components/ExerciseSelectorModal";
import { useAuth } from "../contexts/AuthContext";
import {
  saveWorkoutSession,
  fetchLastExerciseSets,
} from "../services/workoutService";
import {
  fetchUserDashboardData,
  fetchCustomUserPlans,
  fetchCustomWorkoutItems,
} from "../services/planService";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";
import { useSettingsStore } from "../store/settingsStore";
import { RestTimerBar } from "../components/RestTimerBar";
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

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

  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

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

  const { weightUnit } = useSettingsStore();

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

  const handleStartFromDashboard = async (
    planExercises: any[],
    isCustom: boolean,
  ) => {
    if (!user) return;

    setIsLoadingDashboard(true);

    try {
      const mapped = await Promise.all(
        planExercises.map(async (item) => {
          const exerciseId = isCustom ? item.id : item.exercise_id;
          const name = isCustom
            ? item.exercise_name
            : item.exercise?.name || "Nieznane ćwiczenie";
          const targetSets = isCustom
            ? parseInt(item.sets) || 3
            : item.target_sets || 3;
          const videoUrl = isCustom ? item.video_url : item.exercise?.video_url;

          const restTime = parseInt(item.rest_time) || 90;

          const history = await fetchLastExerciseSets(user.id, exerciseId);

          return {
            exerciseId,
            name,
            targetSets,
            videoUrl,
            restTime,
            historicalSets: history || undefined,
          };
        }),
      );

      startWorkoutFromPlan(mapped);
    } catch (error) {
      console.error("Błąd podczas ładowania historii ćwiczeń:", error);
      Alert.alert("Błąd", "Nie udało się załadować planu.");
    } finally {
      setIsLoadingDashboard(false);
    }
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

      Alert.alert("Sukces", "Trening został zapisany!", [
        {
          text: "OK",
          onPress: () => {
            setIsSaving(false);
            endWorkout();
            loadDashboardData();
          },
        },
      ]);
    } catch (error: any) {
      setIsSaving(false);
      Alert.alert("Błąd", error.message);
    }
  };

  if (!isActive) {
    if (isLoadingDashboard) {
      return (
        <View
          style={[
            styles.centerContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          style={[
            styles.dashboardContainer,
            { backgroundColor: theme.background },
          ]}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text style={[styles.dashboardTitle, { color: theme.text }]}>
            Gotowy na trening?
          </Text>
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
              Dzisiejszy plan ({DAY_NAMES[currentDayOfWeek]})
            </Text>
            {todayPlans.length > 0 ? (
              todayPlans.map((tp) => (
                <View
                  key={`${tp.planId}-${tp.day}`}
                  style={[
                    styles.todayCard,
                    {
                      backgroundColor: theme.surface,
                      borderLeftColor: theme.primary,
                    },
                    tp.isCustom && { borderLeftColor: theme.secondary },
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text
                      style={[styles.todayCardTitle, { color: theme.text }]}
                    >
                      {tp.planName}
                    </Text>
                    {tp.isCustom && (
                      <Text
                        style={[
                          styles.privateBadgeTextSmall,
                          {
                            backgroundColor: theme.badgeBg,
                            color: theme.badgeText,
                          },
                        ]}
                      >
                        🔒 Własny
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[styles.todayCardDesc, { color: theme.textMuted }]}
                  >
                    {tp.exercises.length} ćwiczeń zaplanowanych na dzisiaj.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.startTodayButton,
                      { backgroundColor: theme.primary },
                      tp.isCustom && { backgroundColor: theme.secondary },
                    ]}
                    onPress={() =>
                      handleStartFromDashboard(tp.exercises, tp.isCustom)
                    }
                  >
                    <Text
                      style={[
                        styles.startTodayText,
                        { color: theme.primaryText },
                      ]}
                    >
                      Rozpocznij {DAY_NAMES[currentDayOfWeek]}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View
                style={[styles.restDayCard, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.restDayTitle, { color: theme.text }]}>
                  Dzień wolny!
                </Text>
                <Text style={[styles.restDayDesc, { color: theme.textMuted }]}>
                  Nie masz dzisiaj w harmonogramie żadnego planu. Odpoczywaj lub
                  wybierz inny dzień z listy poniżej.
                </Text>
              </View>
            )}
          </View>

          {otherPlans.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
                Wybierz inny dzień (Alternatywa)
              </Text>
              {otherPlans.map((op, index) => (
                <TouchableOpacity
                  key={`${op.planId}-${op.day}-${index}`}
                  style={[
                    styles.otherCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    op.isCustom && {
                      borderLeftWidth: 3,
                      borderLeftColor: theme.secondary,
                    },
                  ]}
                  onPress={() =>
                    handleStartFromDashboard(op.exercises, op.isCustom)
                  }
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardHeaderRow}>
                      <Text
                        style={[styles.otherCardTitle, { color: theme.text }]}
                      >
                        {op.planName}
                      </Text>
                      {op.isCustom && (
                        <Text
                          style={[
                            styles.privateBadgeTextSmall,
                            {
                              backgroundColor: theme.badgeBg,
                              color: theme.badgeText,
                              marginLeft: 5,
                            },
                          ]}
                        >
                          🔒
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[styles.otherCardDesc, { color: theme.textMuted }]}
                    >
                      - {DAY_NAMES[op.day]} ({op.exercises.length} ćwiczeń)
                    </Text>
                  </View>
                  <Text style={[styles.arrowIcon, { color: theme.textMuted }]}>
                    ➔
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity
            style={[
              styles.freeWorkoutButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
            onPress={startWorkout}
          >
            <Text style={[styles.freeWorkoutText, { color: theme.text }]}>
              Rozpocznij pusty trening (bez planu)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background, paddingTop: 10 },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.surface,
              borderBottomColor: theme.border,
              borderBottomWidth: 1,
              paddingBottom: 15,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            Trening w toku
          </Text>
          <TouchableOpacity
            style={[
              styles.dangerButton,
              { backgroundColor: theme.danger },
              isSaving && styles.disabledButton,
            ]}
            onPress={handleFinishWorkout}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.primaryText} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.primaryText }]}>
                Zakończ i zapisz
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.workoutArea}>
          {exercises.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Brak ćwiczeń. Dodaj pierwsze ćwiczenie!
            </Text>
          ) : (
            exercises.map((ex) => {
              const realDbId = (ex as any).exerciseId || ex.id;
              const directVideoUrl = (ex as any).videoUrl;
              const hasVideo = !!videoUrls[realDbId] || !!directVideoUrl;

              return (
                <View
                  key={ex.id}
                  style={[
                    styles.exerciseCard,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <View style={styles.exerciseHeader}>
                    <Text style={[styles.exerciseName, { color: theme.text }]}>
                      {ex.name}
                    </Text>
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
                          color={theme.primary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.columnHeaders}>
                    <Text
                      style={[styles.headerText, { color: theme.textMuted }]}
                    >
                      Seria
                    </Text>
                    <Text
                      style={[styles.headerText, { color: theme.textMuted }]}
                    >
                      {weightUnit === "kg" ? "Kg" : "Lbs"}
                    </Text>
                    <Text
                      style={[styles.headerText, { color: theme.textMuted }]}
                    >
                      Powt.
                    </Text>
                    <Text
                      style={[styles.headerText, { color: theme.textMuted }]}
                    >
                      RPE
                    </Text>
                    <Text
                      style={[styles.headerText, { color: theme.textMuted }]}
                    >
                      ⏱
                    </Text>
                    <Text
                      style={[styles.headerText, { color: theme.textMuted }]}
                    >
                      ✔
                    </Text>
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
                    style={[
                      styles.addSetButton,
                      { backgroundColor: theme.background },
                    ]}
                    onPress={() => addSet(ex.id)}
                  >
                    <Text style={[styles.addSetText, { color: theme.primary }]}>
                      + Dodaj serię
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
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
          <View
            style={[styles.videoContent, { backgroundColor: theme.surface }]}
          >
            <View
              style={[styles.videoHeader, { borderBottomColor: theme.border }]}
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
      <RestTimerBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  dashboardContainer: { flex: 1, padding: 20, paddingTop: 30 },
  dashboardTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 25 },
  section: { marginBottom: 25 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  todayCard: {
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 5,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  privateBadgeTextSmall: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
    overflow: "hidden",
  },
  todayCardTitle: { fontSize: 20, fontWeight: "bold" },
  todayCardDesc: { fontSize: 14, marginTop: 5, marginBottom: 15 },
  startTodayButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  startTodayText: { fontWeight: "bold", fontSize: 16 },
  restDayCard: { borderRadius: 12, padding: 20, alignItems: "center" },
  restDayTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  restDayDesc: { fontSize: 14, textAlign: "center" },
  otherCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  otherCardTitle: { fontSize: 16, fontWeight: "bold" },
  otherCardDesc: { fontSize: 13, marginTop: 3 },
  arrowIcon: { fontSize: 20 },
  divider: { height: 1, marginVertical: 15 },
  freeWorkoutButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  freeWorkoutText: { fontWeight: "bold", fontSize: 15 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold" },
  dangerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.7 },
  buttonText: { fontWeight: "bold", fontSize: 16 },
  secondaryButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    margin: 20,
  },
  secondaryButtonText: { fontWeight: "bold", fontSize: 16 },
  workoutArea: { flex: 1 },
  emptyText: { textAlign: "center", marginTop: 50 },
  exerciseCard: {
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
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
  exerciseName: { fontSize: 18, fontWeight: "bold", flex: 1 },
  columnHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "bold",
    width: 38,
    textAlign: "center",
  },
  addSetButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  addSetText: { fontWeight: "bold" },
  videoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContent: { width: "90%", borderRadius: 12, overflow: "hidden" },
  videoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  videoTitle: { fontSize: 18, fontWeight: "bold", flex: 1, paddingRight: 10 },
  videoWrapper: { width: "100%", backgroundColor: "#000" },
});
