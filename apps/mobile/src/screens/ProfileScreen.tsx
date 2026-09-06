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
  Switch,
  Modal,
  Linking,
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
import { signOut } from "../services/authService";

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

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

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
      setIsEditModalVisible(false);
      Alert.alert("Sukces", "Twój profil został zaktualizowany.");
    } catch (error: any) {
      Alert.alert("Błąd zapisu", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Wylogowanie", "Czy na pewno chcesz się wylogować?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Wyloguj",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Błąd", "Nie udało się wylogować.");
          }
        },
      },
    ]);
  };

  const handleReportBug = () => {
    Linking.openURL(
      "mailto:admin@domena.pl?subject=Zgłoszenie błędu w aplikacji",
    );
  };

  const handleNotImplemented = (feature: string) => {
    Alert.alert("Wkrótce", `Funkcja "${feature}" będzie dostępna wkrótce.`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#17a2b8" />
      </View>
    );
  }

  const SettingsRow = ({
    icon,
    title,
    value,
    onPress,
    rightElement,
    isDestructive = false,
  }: any) => (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsRowLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={isDestructive ? "#e11d48" : "#555"}
          style={styles.settingsIcon}
        />
        <Text
          style={[
            styles.settingsTitle,
            isDestructive && styles.destructiveText,
          ]}
        >
          {title}
        </Text>
      </View>
      <View style={styles.settingsRowRight}>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
        {rightElement
          ? rightElement
          : onPress && (
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Twój Profil</Text>
        </View>
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.8}
            style={styles.avatarContainer}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={50} color="#adb5bd" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>
            {profileData?.display_name || "Użytkownik"}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AKTYWNOŚĆ</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="body-outline"
              title="Moje Wymiary"
              onPress={() => navigation.navigate("Measurements")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>KONTO</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="person-outline"
              title="Edytuj dane profilowe"
              onPress={() => setIsEditModalVisible(true)}
            />
            <SettingsRow
              icon="mail-outline"
              title="Zmień adres e-mail"
              onPress={() => handleNotImplemented("Zmiana adresu e-mail")}
            />
            <SettingsRow
              icon="lock-closed-outline"
              title="Zmień hasło"
              onPress={() => handleNotImplemented("Zmiana hasła")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PREFERENCJE TRENINGOWE</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="barbell-outline"
              title="Jednostka wagi"
              value={weightUnit.toUpperCase()}
              onPress={() => setWeightUnit(weightUnit === "kg" ? "lbs" : "kg")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>WYGLĄD</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="moon-outline"
              title="Tryb ciemny (Dark Mode)"
              rightElement={
                <Switch
                  value={isDarkMode}
                  onValueChange={(val) => setIsDarkMode(val)}
                  trackColor={{ false: "#e9ecef", true: "#17a2b8" }}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>O APLIKACJI</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="information-circle-outline"
              title="Wersja aplikacji"
              value="1.0.0"
            />
            <SettingsRow
              icon="document-text-outline"
              title="Regulamin i Prywatność"
              onPress={() => handleNotImplemented("Regulamin")}
            />
            <SettingsRow
              icon="bug-outline"
              title="Zgłoś błąd"
              onPress={handleReportBug}
            />
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={styles.card}>
            <SettingsRow
              icon="log-out-outline"
              title="Wyloguj się"
              isDestructive={true}
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edytuj Profil</Text>
          <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <View style={styles.editCard}>
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
        </ScrollView>
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
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: { position: "relative", marginBottom: 15 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  userEmail: { fontSize: 14, color: "#666", marginTop: 5 },
  section: { marginTop: 25, paddingHorizontal: 15 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 10,
    marginLeft: 5,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  settingsRowLeft: { flexDirection: "row", alignItems: "center" },
  settingsIcon: { marginRight: 15 },
  settingsTitle: { fontSize: 16, color: "#333" },
  destructiveText: { color: "#e11d48", fontWeight: "bold" },
  settingsRowRight: { flexDirection: "row", alignItems: "center" },
  settingsValue: { fontSize: 15, color: "#888", marginRight: 10 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  modalContent: { flex: 1, backgroundColor: "#f8f9fa" },
  editCard: {
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
