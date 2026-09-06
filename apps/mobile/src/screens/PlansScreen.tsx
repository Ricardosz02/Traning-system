import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { fetchUserPlans, fetchCustomUserPlans } from "../services/planService";
import { AppStackParamList } from "../types/navigation.types";

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
          color="#17a2b8"
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
              colors={["#17a2b8"]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Brak zapisanych planów. Utwórz swój pierwszy schemat!
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.isCustom && styles.customCard]}
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
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.isCustom && (
                  <View style={styles.privateBadge}>
                    <Text style={styles.privateBadgeText}>
                      Własny (Prywatny)
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardDescription}>{item.description}</Text>

              <Text style={styles.cardDate}>
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
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#333" },
  addButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  listContainer: { padding: 20 },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },

  privateBadge: {
    backgroundColor: "#fff3cd",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ffeeba",
  },
  privateBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#856404",
  },

  cardDescription: { fontSize: 14, color: "#666", marginBottom: 10 },
  cardDate: { fontSize: 12, color: "#999", textAlign: "right" },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 40,
    fontSize: 16,
  },
});
