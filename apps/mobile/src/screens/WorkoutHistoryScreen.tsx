import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchWorkoutHistory,
  WorkoutHistoryItem,
} from "../services/workoutService";
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

export const WorkoutHistoryScreen = () => {
  const { user } = useAuth();
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { weightUnit } = useSettingsStore();

  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
              oraz postępy.
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

              <View style={styles.exercisesList}>
                {item.exercises.map((ex, idx) => (
                  <View
                    key={`${item.id}-${ex.exerciseId}-${idx}`}
                    style={[
                      styles.exerciseBlock,
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
                ))}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
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
  exercisesList: {},
  exerciseBlock: {},
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
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
