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
  SafeAreaView,
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
import {
  signOut,
  resetPassword,
  updateEmail,
  updatePassword,
} from "../services/authService";
import { useSettingsStore } from "../store/settingsStore";
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

export const ProfileScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { isDarkMode, toggleTheme } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

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
  const { weightUnit, setWeightUnit } = useSettingsStore();

  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

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
      Alert.alert("Błąd walidacji", "Waga musi być wartością liczbową.");
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

  const handlePasswordChangeSubmit = async () => {
    if (newPasswordInput.length < 6) {
      Alert.alert("Błąd", "Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      Alert.alert("Błąd", "Hasła nie są identyczne.");
      return;
    }

    setIsPasswordLoading(true);
    try {
      await updatePassword(newPasswordInput);
      setIsPasswordModalVisible(false);
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      Alert.alert("Sukces", "Twoje hasło zostało pomyślnie zmienione.");
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleEmailChangeSubmit = async () => {
    if (!newEmail.includes("@")) {
      Alert.alert("Błąd", "Wprowadź poprawny adres e-mail.");
      return;
    }

    setIsEmailLoading(true);
    try {
      await updateEmail(newEmail.trim());
      setIsEmailModalVisible(false);
      setNewEmail("");
      Alert.alert(
        "Potwierdź zmianę",
        "Wysłaliśmy linki potwierdzające na Twój stary oraz nowy adres e-mail. Musisz kliknąć w oba, aby zmiana weszła w życie.",
      );
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    } finally {
      setIsEmailLoading(false);
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
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
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
      style={[styles.settingsRow, { borderBottomColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsRowLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={isDestructive ? theme.danger : theme.textMuted}
          style={styles.settingsIcon}
        />
        <Text
          style={[
            styles.settingsTitle,
            { color: theme.text },
            isDestructive && { color: theme.danger, fontWeight: "bold" },
          ]}
        >
          {title}
        </Text>
      </View>
      <View style={styles.settingsRowRight}>
        {value && (
          <Text style={[styles.settingsValue, { color: theme.textMuted }]}>
            {value}
          </Text>
        )}
        {rightElement
          ? rightElement
          : onPress && (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textMuted}
              />
            )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Twój Profil
          </Text>
        </View>
        <View
          style={[
            styles.profileHeader,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.8}
            style={styles.avatarContainer}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={[styles.avatar, { borderColor: theme.primary }]}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  { borderColor: theme.primary },
                ]}
              >
                <Ionicons name="person" size={50} color={theme.textMuted} />
              </View>
            )}
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: theme.primary, borderColor: theme.surface },
              ]}
            >
              <Ionicons name="camera" size={14} color={theme.primaryText} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: theme.text }]}>
            {profileData?.display_name || "Użytkownik"}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textMuted }]}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
            AKTYWNOŚĆ
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <SettingsRow
              icon="body-outline"
              title="Moje Wymiary"
              onPress={() => navigation.navigate("Measurements")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
            KONTO
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <SettingsRow
              icon="person-outline"
              title="Edytuj dane profilowe"
              onPress={() => setIsEditModalVisible(true)}
            />
            <SettingsRow
              icon="mail-outline"
              title="Zmień adres e-mail"
              onPress={() => setIsEmailModalVisible(true)}
            />
            <SettingsRow
              icon="lock-closed-outline"
              title="Zmień hasło"
              onPress={() => setIsPasswordModalVisible(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
            PREFERENCJE TRENINGOWE
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <SettingsRow
              icon="barbell-outline"
              title="Jednostka wagi"
              value={weightUnit.toUpperCase()}
              onPress={() => setWeightUnit(weightUnit === "kg" ? "lbs" : "kg")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
            WYGLĄD
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <SettingsRow
              icon="moon-outline"
              title="Tryb ciemny (Dark Mode)"
              rightElement={
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor={Platform.OS === "ios" ? "#ffffff" : "#f4f3f4"}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
            O APLIKACJI
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
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
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
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
        <View
          style={[
            styles.modalHeader,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Edytuj Profil
          </Text>
          <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={[styles.modalContent, { backgroundColor: theme.background }]}
        >
          <View style={[styles.editCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Imię / Nazwa użytkownika
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Wpisz jak mamy się do Ciebie zwracać"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Waga (kg)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="np. 78.5"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Wzrost (cm)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="np. 178"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Data urodzenia
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <View pointerEvents="none">
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    value={birthDate}
                    placeholder="Wybierz datę z kalendarza"
                    placeholderTextColor={theme.textMuted}
                    editable={false}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <View
                style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.background },
                ]}
              >
                <DateTimePicker
                  value={dateObj}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                  textColor={theme.text}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={[
                      styles.pickerDoneBtn,
                      { backgroundColor: theme.badgeBg },
                    ]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text
                      style={[styles.pickerDoneText, { color: theme.primary }]}
                    >
                      Gotowe
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.primary },
                saving && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.primaryText} />
              ) : (
                <Text
                  style={[styles.saveButtonText, { color: theme.primaryText }]}
                >
                  Zapisz zmiany
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      <Modal
        visible={isEmailModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPopup, { backgroundColor: theme.surface }]}>
            <Text style={[styles.popupTitle, { color: theme.text }]}>
              Zmień adres e-mail
            </Text>
            <Text style={[styles.popupDesc, { color: theme.textMuted }]}>
              Wpisz nowy adres e-mail. Na oba adresy (stary i nowy) zostaną
              wysłane linki potwierdzające.
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Nowy adres e-mail"
              placeholderTextColor={theme.textMuted}
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.popupActions}>
              <TouchableOpacity
                onPress={() => setIsEmailModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={{ color: theme.textMuted, fontWeight: "bold" }}>
                  Anuluj
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEmailChangeSubmit}
                style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
              >
                {isEmailLoading ? (
                  <ActivityIndicator color={theme.primaryText} />
                ) : (
                  <Text
                    style={{ color: theme.primaryText, fontWeight: "bold" }}
                  >
                    Zmień e-mail
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPasswordModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPopup, { backgroundColor: theme.surface }]}>
            <Text style={[styles.popupTitle, { color: theme.text }]}>
              Zmień hasło
            </Text>
            <Text style={[styles.popupDesc, { color: theme.textMuted }]}>
              Wpisz i potwierdź swoje nowe hasło poniżej.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Nowe hasło:
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={newPasswordInput}
                onChangeText={setNewPasswordInput}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Powtórz nowe hasło:
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={confirmPasswordInput}
                onChangeText={setConfirmPasswordInput}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View style={styles.popupActions}>
              <TouchableOpacity
                onPress={() => {
                  setIsPasswordModalVisible(false);
                  setNewPasswordInput("");
                  setConfirmPasswordInput("");
                }}
                style={styles.cancelBtn}
              >
                <Text style={{ color: theme.textMuted, fontWeight: "bold" }}>
                  Anuluj
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePasswordChangeSubmit}
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: theme.primary,
                    minWidth: 80,
                    alignItems: "center",
                  },
                ]}
              >
                {isPasswordLoading ? (
                  <ActivityIndicator color={theme.primaryText} />
                ) : (
                  <Text
                    style={{ color: theme.primaryText, fontWeight: "bold" }}
                  >
                    Zapisz
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 10, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 40,
    borderBottomWidth: 1,
  },
  avatarContainer: { position: "relative", marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3 },
  avatarPlaceholder: { justifyContent: "center", alignItems: "center" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  userName: { fontSize: 22, fontWeight: "bold" },
  userEmail: { fontSize: 14, marginTop: 5 },
  section: { marginTop: 25, paddingHorizontal: 15 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 5,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 10,
    overflow: "hidden",
    elevation: 1,
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
  },
  settingsRowLeft: { flexDirection: "row", alignItems: "center" },
  settingsIcon: { marginRight: 15 },
  settingsTitle: { fontSize: 16 },
  settingsRowRight: { flexDirection: "row", alignItems: "center" },
  settingsValue: { fontSize: 15, marginRight: 10 },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  modalContent: { flex: 1 },
  editCard: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  inputGroup: { marginBottom: 15 },
  row: { flexDirection: "row" },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 5 },
  input: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 16 },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontWeight: "bold", fontSize: 16 },
  pickerContainer: { borderRadius: 8, marginBottom: 15, overflow: "hidden" },
  pickerDoneBtn: { padding: 12, alignItems: "center" },
  pickerDoneText: { fontWeight: "bold", fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalPopup: { padding: 20, borderRadius: 12 },
  popupTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  popupDesc: { marginBottom: 15, lineHeight: 20 },
  popupActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancelBtn: { padding: 10, marginRight: 10 },
  confirmBtn: { padding: 10, borderRadius: 8 },
});
