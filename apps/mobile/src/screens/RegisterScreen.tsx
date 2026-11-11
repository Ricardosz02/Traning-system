import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signUp } from "../services/authService";
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleRegister = async () => {
    const sanitizedEmail = email
      .replace(/\s+/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .toLowerCase();

    if (!sanitizedEmail || !password || !confirmPassword) {
      Alert.alert("Błąd walidacji", "Proszę wypełnić wszystkie pola.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Błąd walidacji", "Podane hasła nie są identyczne.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Błąd walidacji", "Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    setLoading(true);
    try {
      await signUp(sanitizedEmail, password);
      Alert.alert(
        "Sukces!",
        "Konto zostało utworzone. Możesz się teraz zalogować.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }],
      );
    } catch (error: any) {
      Alert.alert("Błąd rejestracji", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>Dołącz do nas</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Załóż darmowe konto treningowe
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="Adres e-mail"
          placeholderTextColor={theme.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="Hasło (min. 6 znaków)"
          placeholderTextColor={theme.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="Powtórz hasło"
          placeholderTextColor={theme.textMuted}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>
              Zarejestruj się
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 15,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  input: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
