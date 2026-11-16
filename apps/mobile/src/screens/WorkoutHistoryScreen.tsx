import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchWorkoutHistory,
  WorkoutHistoryItem,
  HistoryExerciseGroup,
} from "../services/workoutService";
import {
  MuscleMap,
  MapMuscleRegion,
  MAP_REGION_LABELS,
  DB_MUSCLE_TO_REGION,
} from "../components/MuscleMap";
import { useThemeStore } from "../store/themeStore";
import { useSettingsStore } from "../store/settingsStore";
import { colors } from "../theme/colors";

const POLISH_DAYS = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

const SHORT_DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

const SHORT_MONTHS = [
  "sty",
  "lut",
  "mar",
  "kwi",
  "maj",
  "cze",
  "lip",
  "sie",
  "wrz",
  "paź",
  "lis",
  "gru",
];

const formatWorkoutDate = (isoString: string) => {
  const date = new Date(isoString);
  const dayName = POLISH_DAYS[date.getDay()];
  const formattedDate = date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dayName}, ${formattedDate} • ${formattedTime}`;
};

const getMondayOfWeek = (baseDate: Date): Date => {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const WorkoutHistoryScreen = () => {
  const { user } = useAuth();
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { weightUnit } = useSettingsStore();

  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<"weekly" | "list">("weekly");
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<MapMuscleRegion | null>(
    null,
  );

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const data = await fetchWorkoutHistory(user.id);
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatWeight = (kgValue: number) => {
    if (weightUnit === "lbs") {
      return `${Math.round(kgValue * 2.20462)} lbs`;
    }
    return `${Number(kgValue.toFixed(1))} kg`;
  };

  const weekDays = useMemo(() => {
    const today = new Date();
    const monday = getMondayOfWeek(today);
    monday.setDate(monday.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: d,
        key: formatDateKey(d),
        shortDay: SHORT_DAYS[i],
        dayNumber: d.getDate(),
        monthShort: SHORT_MONTHS[d.getMonth()],
        year: d.getFullYear(),
      };
    });
  }, [weekOffset]);

  const weekRangeLabel = useMemo(() => {
    const first = weekDays[0];
    const last = weekDays[6];
    if (first.monthShort === last.monthShort) {
      return `${first.dayNumber} – ${last.dayNumber} ${last.monthShort} ${last.year}`;
    }
    return `${first.dayNumber} ${first.monthShort} – ${last.dayNumber} ${last.monthShort} ${last.year}`;
  }, [weekDays]);

  const weekWorkouts = useMemo(() => {
    const dayKeysSet = new Set(weekDays.map((d) => d.key));
    return history.filter((w) => {
      const key = formatDateKey(new Date(w.startedAt));
      return dayKeysSet.has(key);
    });
  }, [history, weekDays]);

  const activeDayKeys = useMemo(() => {
    const set = new Set<string>();
    weekWorkouts.forEach((w) => {
      set.add(formatDateKey(new Date(w.startedAt)));
    });
    return set;
  }, [weekWorkouts]);

  const filteredWorkouts = useMemo(() => {
    if (!selectedDayKey) return weekWorkouts;
    return weekWorkouts.filter(
      (w) => formatDateKey(new Date(w.startedAt)) === selectedDayKey,
    );
  }, [weekWorkouts, selectedDayKey]);

  const { muscleLoad, regionVolume, totalSetsCount, totalVolumeKg } =
    useMemo(() => {
      const load: Partial<Record<MapMuscleRegion, number>> = {};
      const volume: Partial<Record<MapMuscleRegion, number>> = {};
      let setsTotal = 0;
      let volTotal = 0;

      filteredWorkouts.forEach((w) => {
        volTotal += w.totalVolume;
        w.exercises.forEach((ex) => {
          const exSets = ex.sets.length;
          const exVol = ex.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
          setsTotal += exSets;

          const regionsForEx = new Set<MapMuscleRegion>();
          ex.muscleGroups.forEach((mg) => {
            const region =
              DB_MUSCLE_TO_REGION[mg] || DB_MUSCLE_TO_REGION[mg.toLowerCase()];
            if (region) regionsForEx.add(region);
          });

          regionsForEx.forEach((reg) => {
            load[reg] = (load[reg] || 0) + exSets;
            volume[reg] = (volume[reg] || 0) + exVol;
          });
        });
      });

      return {
        muscleLoad: load,
        regionVolume: volume,
        totalSetsCount: setsTotal,
        totalVolumeKg: volTotal,
      };
    }, [filteredWorkouts]);

  const displayedExercises = useMemo(() => {
    const items: {
      workoutId: string;
      workoutDate: string;
      exercise: HistoryExerciseGroup;
    }[] = [];

    filteredWorkouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        if (selectedRegion) {
          const matchesRegion = ex.muscleGroups.some((mg) => {
            const reg =
              DB_MUSCLE_TO_REGION[mg] || DB_MUSCLE_TO_REGION[mg.toLowerCase()];
            return reg === selectedRegion;
          });
          if (!matchesRegion) return;
        }
        items.push({
          workoutId: w.id,
          workoutDate: w.startedAt,
          exercise: ex,
        });
      });
    });

    return items;
  }, [filteredWorkouts, selectedRegion]);

  const handleChangeWeek = (delta: number) => {
    setWeekOffset((prev) => prev + delta);
    setSelectedDayKey(null);
    setSelectedRegion(null);
  };

  const handleSelectRegion = (region: MapMuscleRegion) => {
    setSelectedRegion((prev) => (prev === region ? null : region));
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.segmentedWrapper,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.segmentedControl,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === "weekly" && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab("weekly")}
          >
            <Ionicons
              name="body-outline"
              size={16}
              color={
                activeTab === "weekly" ? theme.primaryText : theme.textMuted
              }
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    activeTab === "weekly"
                      ? theme.primaryText
                      : theme.textMuted,
                },
              ]}
            >
              Tydzień i Mięśnie
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === "list" && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab("list")}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={activeTab === "list" ? theme.primaryText : theme.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    activeTab === "list" ? theme.primaryText : theme.textMuted,
                },
              ]}
            >
              Lista ({history.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "weekly" ? (
        <ScrollView
          contentContainerStyle={styles.weeklyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          <View
            style={[
              styles.calendarCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.weekNavRow}>
              <TouchableOpacity
                style={[styles.weekNavBtn, { borderColor: theme.border }]}
                onPress={() => handleChangeWeek(-1)}
              >
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setWeekOffset(0);
                  setSelectedDayKey(null);
                  setSelectedRegion(null);
                }}
                style={styles.weekTitleWrap}
              >
                <Text style={[styles.weekTitle, { color: theme.text }]}>
                  {weekRangeLabel}
                </Text>
                <Text style={[styles.weekSubtitle, { color: theme.primary }]}>
                  {weekOffset === 0
                    ? "Bieżący tydzień"
                    : weekOffset === -1
                      ? "Poprzedni tydzień"
                      : "Kliknij, aby wrócić do dziś"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.weekNavBtn,
                  { borderColor: theme.border },
                  weekOffset >= 0 && { opacity: 0.35 },
                ]}
                onPress={() => handleChangeWeek(1)}
                disabled={weekOffset >= 0}
              >
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.daysStrip}>
              {weekDays.map((day) => {
                const hasWorkout = activeDayKeys.has(day.key);
                const isSelected = selectedDayKey === day.key;

                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.dayPill,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.background,
                        borderColor: isSelected
                          ? theme.primary
                          : hasWorkout
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedDayKey((prev) =>
                        prev === day.key ? null : day.key,
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.dayShortText,
                        {
                          color: isSelected
                            ? theme.primaryText
                            : theme.textMuted,
                        },
                      ]}
                    >
                      {day.shortDay}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumText,
                        {
                          color: isSelected ? theme.primaryText : theme.text,
                        },
                      ]}
                    >
                      {day.dayNumber}
                    </Text>
                    <View
                      style={[
                        styles.workoutDot,
                        {
                          backgroundColor: hasWorkout
                            ? isSelected
                              ? "#ffffff"
                              : theme.primary
                            : "transparent",
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View
              style={[styles.weekSummaryBar, { borderTopColor: theme.border }]}
            >
              <View style={styles.weekStat}>
                <Text style={[styles.weekStatVal, { color: theme.text }]}>
                  {filteredWorkouts.length}
                </Text>
                <Text style={[styles.weekStatLbl, { color: theme.textMuted }]}>
                  Treningi
                </Text>
              </View>
              <View
                style={[
                  styles.weekStatDivider,
                  { backgroundColor: theme.border },
                ]}
              />
              <View style={styles.weekStat}>
                <Text style={[styles.weekStatVal, { color: theme.text }]}>
                  {totalSetsCount}
                </Text>
                <Text style={[styles.weekStatLbl, { color: theme.textMuted }]}>
                  Serie
                </Text>
              </View>
              <View
                style={[
                  styles.weekStatDivider,
                  { backgroundColor: theme.border },
                ]}
              />
              <View style={styles.weekStat}>
                <Text style={[styles.weekStatVal, { color: theme.primary }]}>
                  {formatWeight(totalVolumeKg)}
                </Text>
                <Text style={[styles.weekStatLbl, { color: theme.textMuted }]}>
                  Tonaż
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.mapCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.mapCardHeader}>
              <Text style={[styles.mapCardTitle, { color: theme.text }]}>
                Obciążenie partii mięśniowych
              </Text>
              <Text style={[styles.mapCardHint, { color: theme.textMuted }]}>
                Kliknij w mięsień na mapie, aby przefiltrować
              </Text>
            </View>

            <MuscleMap
              muscleLoad={muscleLoad}
              selectedRegion={selectedRegion}
              onSelectRegion={handleSelectRegion}
              hideTitle={true}
            />

            <View style={styles.legendRow}>
              <Text style={[styles.legendText, { color: theme.textMuted }]}>
                Brak
              </Text>
              <View
                style={[
                  styles.legendSwatch,
                  { backgroundColor: isDarkMode ? "#3f4756" : "#cbd5e1" },
                ]}
              />
              <View
                style={[
                  styles.legendSwatch,
                  { backgroundColor: theme.primary, opacity: 0.4 },
                ]}
              />
              <View
                style={[
                  styles.legendSwatch,
                  { backgroundColor: theme.primary, opacity: 0.7 },
                ]}
              />
              <View
                style={[
                  styles.legendSwatch,
                  { backgroundColor: theme.primary, opacity: 1 },
                ]}
              />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>
                Maks. objętość
              </Text>
            </View>

            {selectedRegion && (
              <View
                style={[
                  styles.selectedMuscleBanner,
                  {
                    backgroundColor: theme.badgeBg,
                    borderColor: theme.badgeBorder,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.selectedMuscleTitle,
                      { color: theme.badgeText },
                    ]}
                  >
                    {MAP_REGION_LABELS[selectedRegion]}
                  </Text>
                  <Text
                    style={[styles.selectedMuscleStats, { color: theme.text }]}
                  >
                    {muscleLoad[selectedRegion] || 0} serii •{" "}
                    {formatWeight(regionVolume[selectedRegion] || 0)} tonażu
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRegion(null)}>
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color={theme.badgeText}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.weeklyExercisesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
                {selectedRegion
                  ? `Ćwiczenia: ${MAP_REGION_LABELS[selectedRegion]}`
                  : selectedDayKey
                    ? "Ćwiczenia z wybranego dnia"
                    : "Wszystkie ćwiczenia w tym tygodniu"}
              </Text>
              {(selectedDayKey || selectedRegion) && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDayKey(null);
                    setSelectedRegion(null);
                  }}
                >
                  <Text
                    style={[styles.resetFilterText, { color: theme.primary }]}
                  >
                    Wyczyść filtry
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {displayedExercises.length === 0 ? (
              <View
                style={[
                  styles.emptyWeekCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={[styles.emptyWeekText, { color: theme.textMuted }]}
                >
                  Brak wykonanych ćwiczeń spełniających wybrane kryteria.
                </Text>
              </View>
            ) : (
              displayedExercises.map((item, idx) => (
                <View
                  key={`${item.workoutId}-${item.exercise.exerciseId}-${idx}`}
                  style={[
                    styles.weeklyExerciseCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.weeklyExHeader}>
                    <Text
                      style={[styles.exerciseName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.exercise.exerciseName}
                    </Text>
                    <Text
                      style={[
                        styles.weeklyExDayTag,
                        { color: theme.textMuted },
                      ]}
                    >
                      {
                        SHORT_DAYS[
                          new Date(item.workoutDate).getDay() === 0
                            ? 6
                            : new Date(item.workoutDate).getDay() - 1
                        ]
                      }
                    </Text>
                  </View>

                  <View style={styles.setsWrap}>
                    {item.exercise.sets.map((s, sIdx) => (
                      <View
                        key={s.id || sIdx}
                        style={[
                          styles.setBadge,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.setBadgeText, { color: theme.text }]}
                        >
                          {formatWeight(s.weight)} × {s.reps}
                        </Text>
                        {s.rpe !== null && s.rpe > 0 && (
                          <Text
                            style={[
                              styles.setRpeText,
                              { color: theme.primary },
                            ]}
                          >
                            {" "}
                            @{s.rpe}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="barbell-outline"
                size={48}
                color={theme.textMuted}
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Brak zapisanych treningów
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
                Ukończ swój pierwszy trening, aby śledzić historię serii, tonażu
                oraz obciążenie mięśni.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const totalSets = item.exercises.reduce(
              (acc, ex) => acc + ex.sets.length,
              0,
            );

            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {formatWorkoutDate(item.startedAt)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricsRow,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <View style={styles.metricItem}>
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={theme.primary}
                    />
                    <Text style={[styles.metricText, { color: theme.text }]}>
                      {item.durationMinutes} min
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.metricDivider,
                      { backgroundColor: theme.border },
                    ]}
                  />

                  <View style={styles.metricItem}>
                    <Ionicons
                      name="barbell-outline"
                      size={15}
                      color={theme.primary}
                    />
                    <Text style={[styles.metricText, { color: theme.text }]}>
                      {formatWeight(item.totalVolume)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.metricDivider,
                      { backgroundColor: theme.border },
                    ]}
                  />

                  <View style={styles.metricItem}>
                    <Ionicons
                      name="layers-outline"
                      size={15}
                      color={theme.primary}
                    />
                    <Text style={[styles.metricText, { color: theme.text }]}>
                      {totalSets} serii
                    </Text>
                  </View>
                </View>

                <View>
                  {item.exercises.map((ex, idx) => (
                    <View
                      key={`${item.id}-${ex.exerciseId}-${idx}`}
                      style={[
                        idx > 0 && {
                          borderTopWidth: 1,
                          borderTopColor: theme.border,
                          paddingTop: 10,
                          marginTop: 10,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.exerciseName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {ex.exerciseName}
                      </Text>

                      <View style={styles.setsWrap}>
                        {ex.sets.map((s, sIdx) => (
                          <View
                            key={s.id || sIdx}
                            style={[
                              styles.setBadge,
                              {
                                backgroundColor: theme.background,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.setBadgeText,
                                { color: theme.text },
                              ]}
                            >
                              {formatWeight(s.weight)} × {s.reps}
                            </Text>
                            {s.rpe !== null && s.rpe > 0 && (
                              <Text
                                style={[
                                  styles.setRpeText,
                                  { color: theme.primary },
                                ]}
                              >
                                {" "}
                                @{s.rpe}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  segmentedWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  weeklyScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  calendarCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  weekNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  weekNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekTitleWrap: {
    alignItems: "center",
  },
  weekTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  weekSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  daysStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 14,
  },
  dayPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayShortText: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  workoutDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  weekSummaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  weekStat: {
    flex: 1,
    alignItems: "center",
  },
  weekStatVal: {
    fontSize: 15,
    fontWeight: "bold",
  },
  weekStatLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  weekStatDivider: {
    width: 1,
    height: 24,
  },
  mapCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  mapCardHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  mapCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  mapCardHint: {
    fontSize: 12,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    gap: 5,
  },
  legendSwatch: {
    width: 16,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    marginHorizontal: 3,
  },
  selectedMuscleBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectedMuscleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  selectedMuscleStats: {
    fontSize: 13,
    fontWeight: "600",
  },
  weeklyExercisesSection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyWeekCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyWeekText: {
    fontSize: 13,
    textAlign: "center",
  },
  weeklyExerciseCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  weeklyExHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  weeklyExDayTag: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContainer: { padding: 16, paddingBottom: 40 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  metricText: {
    fontSize: 13,
    fontWeight: "700",
  },
  metricDivider: {
    width: 1,
    height: 16,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginBottom: 6,
  },
  setsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  setBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 1,
  },
  setBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  setRpeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
