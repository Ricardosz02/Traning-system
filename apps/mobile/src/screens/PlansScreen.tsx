import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUserPlans,
  fetchUserDashboardData,
  fetchCustomUserPlans,
  fetchCustomWorkoutItems,
  deletePlan,
} from "../services/planService";
import { AppStackParamList } from "../types/navigation.types";
import { colors } from "../theme/colors";
import { useThemeStore } from "../store/themeStore";

type CombinedPlan = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  isCustom: boolean;
  daysCount: number;
  exercisesCount: number;
};

const formatDaysCount = (count?: number): string => {
  const safeCount = Number(count) || 0;
  if (safeCount === 0) return "Brak dni";
  if (safeCount === 1) return "1 dzień treningowy";
  const mod10 = safeCount % 10;
  const mod100 = safeCount % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${safeCount} dni treningowe`;
  }
  return `${safeCount} dni treningowych`;
};

const formatExerciseCount = (count?: number): string => {
  const safeCount = Number(count) || 0;
  if (safeCount === 1) return "1 ćwiczenie";
  const mod10 = safeCount % 10;
  const mod100 = safeCount % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${safeCount} ćwiczenia`;
  }
  return `${safeCount} ćwiczeń`;
};

export const PlansScreen = () => {
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const { isDarkMode: isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;

  const [plans, setPlans] = useState<CombinedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlans = async () => {
    if (!user) return;
    try {
      const [standardData, dashboardData, customData] = await Promise.all([
        fetchUserPlans(user.id),
        fetchUserDashboardData(user.id),
        fetchCustomUserPlans(user.id),
      ]);

      const standardMapped: CombinedPlan[] = standardData.map((p: any) => {
        const dashMatch = dashboardData?.find((d: any) => d.id === p.id);
        const planExercises =
          dashMatch?.plan_exercises || p.plan_exercises || [];
        const uniqueDays = new Set(
          planExercises.map((pe: any) => pe.day_of_week),
        );

        return {
          id: p.id,
          name: p.name,
          description: p.description || null,
          created_at: p.created_at,
          isCustom: false,
          daysCount: uniqueDays.size,
          exercisesCount: planExercises.length,
        };
      });

      const customMapped: CombinedPlan[] = await Promise.all(
        customData.map(async (p: any) => {
          const items = await fetchCustomWorkoutItems(p.id);
          const uniqueDays = new Set(
            (items || []).map((item: any) => item.day_of_week),
          );

          return {
            id: p.id,
            name: p.name,
            description: null,
            created_at: p.created_at,
            isCustom: true,
            daysCount: uniqueDays.size,
            exercisesCount: items?.length || 0,
          };
        }),
      );

      const combined: CombinedPlan[] = [
        ...standardMapped,
        ...customMapped,
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setPlans(combined);
    } catch (error) {
      console.error("Błąd ładowania planów:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadPlans();
    });
    return unsubscribe;
  }, [navigation, user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPlans();
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    Alert.alert(
      "Usuwanie planu",
      `Czy na pewno chcesz usunąć plan "${planName}"? Tej operacji nie można cofnąć.`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deletePlan(planId);
              Alert.alert("Sukces", "Plan został usunięty.");
              loadPlans();
            } catch (error) {
              Alert.alert("Błąd", "Nie udało się usunąć planu.");
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <Text style={styles.title}>Twoje Plany Treningowe</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("CreatePlan")}
          >
            <Text style={styles.addButtonText}>+ Nowy Plan</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={plans}
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
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Brak zapisanych planów. Utwórz swój pierwszy schemat!
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.surface,
                    shadowColor: "#000",
                  },
                  item.isCustom && {
                    borderLeftWidth: 4,
                    borderLeftColor: theme.customCardBorder,
                  },
                ]}
                onPress={() => {
                  if (item.isCustom) {
                    navigation.navigate("CustomPlanDetails", {
                      planId: item.id,
                      planName: item.name,
                    });
                  } else {
                    navigation.navigate("PlanDetails", {
                      planId: item.id,
                      planName: item.name,
                    });
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleAndBadge}>
                    <Text
                      style={[styles.cardTitle, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.isCustom && (
                      <View
                        style={[
                          styles.privateBadge,
                          {
                            backgroundColor: theme.badgeBg,
                            borderColor: theme.badgeBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.privateBadgeText,
                            { color: theme.badgeText },
                          ]}
                        >
                          Własny
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => handleDeletePlan(item.id, item.name)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={theme.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardBodyRow}>
                  <View style={styles.statsContainer}>
                    <View
                      style={[
                        styles.statPill,
                        { backgroundColor: theme.background },
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color={theme.primary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[styles.statPillText, { color: theme.text }]}
                      >
                        {formatDaysCount(item.daysCount)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statPill,
                        { backgroundColor: theme.background },
                      ]}
                    >
                      <Ionicons
                        name="barbell-outline"
                        size={13}
                        color={theme.primary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[styles.statPillText, { color: theme.text }]}
                      >
                        {formatExerciseCount(item.exercisesCount)}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textMuted}
                  />
                </View>

                {item.description ? (
                  <Text
                    style={[styles.cardDescription, { color: theme.textMuted }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}

                <Text style={[styles.cardDate, { color: theme.textMuted }]}>
                  Utworzono:{" "}
                  {new Date(item.created_at).toLocaleDateString("pl-PL")}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 56,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#ffffff" },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  listContainer: { padding: 20 },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleAndBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flexShrink: 1,
  },
  privateBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  privateBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  deleteIconBtn: {
    padding: 4,
  },
  cardBodyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  cardDate: {
    fontSize: 11,
    textAlign: "right",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
    lineHeight: 24,
  },
});
