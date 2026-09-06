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

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Witaj w Aplikacji</Text>
      <Text style={styles.subtitle}>Zaloguj się, aby kontynuować trening</Text>

      <TextInput
        style={styles.input}
        placeholder="Adres e-mail"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Hasło"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.forgotPasswordContainer}
        onPress={() => setIsResetModalVisible(true)}
      >
        <Text style={styles.forgotPasswordText}>Zapomniałeś hasła?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Zaloguj</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.linkText}>Nie masz konta? Zarejestruj się</Text>
      </TouchableOpacity>

      <Modal
        visible={isResetModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Resetowanie hasła</Text>
            <Text style={styles.modalSubtitle}>
              Podaj adres e-mail przypisany do Twojego konta. Wyślemy Ci
              bezpieczny link, dzięki któremu w kilku krokach ustawisz nowe
              hasło i odzyskasz dostęp.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Twój adres e-mail"
              placeholderTextColor="#999"
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
                <Text style={styles.cancelButtonText}>Anuluj</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendResetLink}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>Wyślij link</Text>
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
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
    color: "#333",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#17a2b8",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#93d3dd",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#17a2b8",
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
    backgroundColor: "#fff",
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
    color: "#333",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#555",
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
    color: "#666",
    fontWeight: "bold",
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
