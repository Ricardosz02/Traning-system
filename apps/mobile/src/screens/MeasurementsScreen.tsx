import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchMeasurements,
  addMeasurement,
  deleteMeasurement,
} from "../services/measurementService";
import { BodyMeasurement } from "../types/database.types";

export const MeasurementsScreen = () => {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [biceps, setBiceps] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [thighs, setThighs] = useState("");
  const [calves, setCalves] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await fetchMeasurements(user.id);
      setMeasurements(data);
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const parseVal = (val: string) =>
        val ? parseFloat(val.replace(",", ".")) : null;

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const localDateString = `${year}-${month}-${day}`;

      const newEntry = await addMeasurement(user.id, {
        biceps: parseVal(biceps),
        chest: parseVal(chest),
        waist: parseVal(waist),
        thighs: parseVal(thighs),
        calves: parseVal(calves),
        date: localDateString,
      });

      setMeasurements([newEntry, ...measurements]);
      setModalVisible(false);

      setBiceps("");
      setChest("");
      setWaist("");
      setThighs("");
      setCalves("");
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Usuń pomiar", "Czy na pewno chcesz usunąć ten wpis?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMeasurement(id);
            setMeasurements(measurements.filter((m) => m.id !== id));
          } catch (error: any) {
            Alert.alert("Błąd", error.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: BodyMeasurement }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>
          <Ionicons name="calendar-outline" size={16} />{" "}
          {new Date(item.date).toLocaleDateString("pl-PL")}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Biceps</Text>
          <Text style={styles.value}>{item.biceps || "--"} cm</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Klatka</Text>
          <Text style={styles.value}>{item.chest || "--"} cm</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Talia</Text>
          <Text style={styles.value}>{item.waist || "--"} cm</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Uda</Text>
          <Text style={styles.value}>{item.thighs || "--"} cm</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Łydki</Text>
          <Text style={styles.value}>{item.calves || "--"} cm</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#17a2b8"
          style={{ marginTop: 50 }}
        />
      ) : measurements.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="body-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            Brak pomiarów. Dodaj swój pierwszy wpis!
          </Text>
        </View>
      ) : (
        <FlatList
          data={measurements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          // @ts-ignore
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowy pomiar</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Biceps (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={biceps}
                  onChangeText={setBiceps}
                  keyboardType="numeric"
                  placeholder="np. 38.5"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Klatka (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={chest}
                  onChangeText={setChest}
                  keyboardType="numeric"
                  placeholder="np. 105"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Talia / Brzuch (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={waist}
                  onChangeText={setWaist}
                  keyboardType="numeric"
                  placeholder="np. 82"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Uda (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={thighs}
                  onChangeText={setThighs}
                  keyboardType="numeric"
                  placeholder="np. 60"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Łydki (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={calves}
                  onChangeText={setCalves}
                  keyboardType="numeric"
                  placeholder="np. 40"
                />
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Zapisz pomiary</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
    marginBottom: 10,
  },
  dateText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: { width: "30%", marginBottom: 10 },
  label: { fontSize: 12, color: "#666" },
  value: { fontSize: 16, fontWeight: "bold", color: "#17a2b8" },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#17a2b8",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  inputLabel: { fontSize: 16, color: "#333", flex: 1 },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 10,
    flex: 1,
    fontSize: 16,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "#17a2b8",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  listContent: {
    padding: 15,
    paddingBottom: 80,
  },
});
