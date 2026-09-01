import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUserProfile,
  updateUserProfile,
  uploadAvatar,
} from "../services/profileService";
import { Profile } from "../types/database.types";

export const ProfileScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [birthDate, setBirthDate] = useState("");
  const [dateObj, setDateObj] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const data = await fetchUserProfile(user.id);
        setProfileData(data);

        setDisplayName(data.display_name || "");
        setWeight(data.weight ? data.weight.toString() : "");
        setHeight(data.height ? data.height.toString() : "");
        setAvatarUrl(data.avatar_url || null);

        if (data.birth_date) {
          setBirthDate(data.birth_date);
          setDateObj(new Date(data.birth_date));
        }
      } catch (error: any) {
        Alert.alert("Błąd", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Brak uprawnień",
        "Musisz zezwolić na dostęp do galerii, aby ustawić awatar.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      const localUri = result.assets[0].uri;

      try {
        setSaving(true);
        const publicUrl = await uploadAvatar(user!.id, localUri);

        setAvatarUrl(publicUrl);

        const updatedData = await updateUserProfile(user!.id, user?.email, {
          avatar_url: publicUrl,
        });
        setProfileData(updatedData);
        Alert.alert("Sukces", "Zdjęcie profilowe zostało zaktualizowane.");
      } catch (error: any) {
        Alert.alert("Błąd", error.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDateObj(selectedDate);

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");

      const formatted = `${year}-${month}-${day}`;
      setBirthDate(formatted);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const parsedWeight = weight ? parseFloat(weight.replace(",", ".")) : null;
    const parsedHeight = height ? parseInt(height, 10) : null;

    if (weight && isNaN(parsedWeight as number)) {
      Alert.alert("Błąd walidacji", "Waga musi być wartością liczbowową.");
      return;
    }

    setSaving(true);
    try {
      const updatedData = await updateUserProfile(user.id, user.email, {
        display_name: displayName.trim() || null,
        weight: parsedWeight,
        height: parsedHeight,
        birth_date: birthDate.trim() || null,
        avatar_url: avatarUrl,
      });

      setProfileData(updatedData);
      Alert.alert("Sukces", "Twój profil został zaktualizowany.");
    } catch (error: any) {
      Alert.alert("Błąd zapisu", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#17a2b8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Twój Profil</Text>
      </View>

      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              onError={(e) =>
                console.log("Błąd ładowania obrazka:", e.nativeEvent.error)
              }
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={50} color="#adb5bd" />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Stuknij, aby zmienić zdjęcie</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informacje o koncie</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>E-mail:</Text>
          <Text style={styles.infoValue}>
            {profileData?.email || user?.email}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dołączył(a):</Text>
          <Text style={styles.infoValue}>
            {profileData?.created_at
              ? new Date(profileData.created_at).toLocaleDateString("pl-PL")
              : "Brak danych"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dane personalne i fizyczne</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Imię / Nazwa użytkownika</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Wpisz jak mamy się do Ciebie zwracać"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Waga (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="np. 78.5"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Wzrost (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="np. 178"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Data urodzenia</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput
                style={styles.input}
                value={birthDate}
                placeholder="Wybierz datę z kalendarza"
                editable={false}
              />
            </View>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.pickerDoneText}>Gotowe</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Zapisz zmiany</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.card,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 0,
            marginBottom: 40,
          },
        ]}
        onPress={() => navigation.navigate("Measurements")}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="body"
            size={24}
            color="#17a2b8"
            style={{ marginRight: 10 }}
          />
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>
            Moje Wymiary
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },

  avatarContainer: { alignItems: "center", marginTop: 20, marginBottom: 10 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#17a2b8",
  },
  avatarPlaceholder: {
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#17a2b8",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarHint: { fontSize: 12, color: "#666", marginTop: 8 },

  card: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: { fontSize: 15, color: "#555", fontWeight: "bold" },
  infoValue: { fontSize: 15, color: "#17a2b8", fontWeight: "bold" },
  inputGroup: { marginBottom: 15 },
  row: { flexDirection: "row" },
  label: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 5 },
  input: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
  },
  pickerDoneBtn: {
    padding: 12,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
  },
  pickerDoneText: { color: "#0284c7", fontWeight: "bold", fontSize: 16 },
});
