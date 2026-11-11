import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { signIn, resetPassword } from "../services/authService";
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleLogin = async () => {
    const sanitizedEmail = email.trim();

    if (!sanitizedEmail || !password) {
      Alert.alert("Błąd walidacji", "Proszę podać adres e-mail oraz hasło.");
      return;
    }

    setLoading(true);
    try {
      await signIn(sanitizedEmail, password);
    } catch (error: any) {
      Alert.alert("Błąd logowania", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async () => {
    const sanitizedEmail = resetEmail.trim();

    if (!sanitizedEmail) {
      Alert.alert(
        "Błąd",
        "Proszę podać adres e-mail, na który mamy wysłać link.",
      );
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(sanitizedEmail);
      setIsResetModalVisible(false);
      setResetEmail("");
      Alert.alert(
        "Link wysłany!",
        "Sprawdź swoją skrzynkę pocztową. Jeśli podany adres istnieje w naszej bazie, znajdziesz tam link do ustawienia nowego hasła.",
      );
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Witaj w Aplikacji
      </Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Zaloguj się, aby kontynuować trening
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
        placeholder="Hasło"
        placeholderTextColor={theme.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.forgotPasswordContainer}
        onPress={() => setIsResetModalVisible(true)}
      >
        <Text style={[styles.forgotPasswordText, { color: theme.textMuted }]}>
          Zapomniałeś hasła?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.primary },
          loading && { opacity: 0.7 },
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.primaryText} />
        ) : (
          <Text style={[styles.buttonText, { color: theme.primaryText }]}>
            Zaloguj
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={[styles.linkText, { color: theme.primary }]}>
          Nie masz konta? Zarejestruj się
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isResetModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Resetowanie hasła
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Podaj adres e-mail przypisany do Twojego konta. Wyślemy Ci
              bezpieczny link, dzięki któremu w kilku krokach ustawisz nowe
              hasło i odzyskasz dostęp.
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
              placeholder="Twój adres e-mail"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={resetEmail}
              onChangeText={setResetEmail}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsResetModalVisible(false)}
                disabled={resetLoading}
              >
                <Text
                  style={[styles.cancelButtonText, { color: theme.textMuted }]}
                >
                  Anuluj
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.primary }]}
                onPress={handleSendResetLink}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color={theme.primaryText} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.sendButtonText,
                      { color: theme.primaryText },
                    ]}
                  >
                    Wyślij link
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
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
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    padding: 25,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
  },
  cancelButton: {
    padding: 12,
    marginRight: 10,
    justifyContent: "center",
  },
  cancelButtonText: {
    fontWeight: "bold",
    fontSize: 15,
  },
  sendButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  sendButtonText: {
    fontWeight: "bold",
    fontSize: 15,
  },
});
