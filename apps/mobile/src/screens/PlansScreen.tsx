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
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUserPlans,
  fetchCustomUserPlans,
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
};

export const PlansScreen = () => {
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const systemColorScheme = useColorScheme();
  const { isDarkMode: isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;

  const [plans, setPlans] = useState<CombinedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlans = async () => {
    if (!user) return;
    try {
      const [standardData, customData] = await Promise.all([
        fetchUserPlans(user.id),
        fetchCustomUserPlans(user.id),
      ]);

      const standardMapped: CombinedPlan[] = standardData.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || null,
        created_at: p.created_at,
        isCustom: false,
      }));

      const customMapped: CombinedPlan[] = customData.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: "Plan zdefiniowany przez Ciebie z własnymi ćwiczeniami.",
        created_at: p.created_at,
        isCustom: true,
      }));

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          Twoje Plany Treningowe
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate("CreatePlan")}
        >
          <Text style={[styles.addButtonText, { color: theme.primaryText }]}>
            + Nowy Plan
          </Text>
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
                  shadowColor: isDark ? "#000" : "#000",
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
                        Własny (Prywatny)
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    { backgroundColor: theme.dangerBg },
                  ]}
                  onPress={() => handleDeletePlan(item.id, item.name)}
                >
                  <Text
                    style={[styles.deleteButtonText, { color: theme.danger }]}
                  >
                    Usuń
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.cardDescription, { color: theme.textMuted }]}
              >
                {item.description}
              </Text>

              <Text style={[styles.cardDate, { color: theme.textMuted }]}>
                Utworzono:{" "}
                {new Date(item.created_at).toLocaleDateString("pl-PL")}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: { fontWeight: "bold" },
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
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleAndBadge: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  privateBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  privateBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  cardDescription: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  cardDate: { fontSize: 12, textAlign: "right" },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
    lineHeight: 24,
  },
});
