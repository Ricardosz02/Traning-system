import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { signUp } from "../services/authService";

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Dołącz do nas</Text>
      <Text style={styles.subtitle}>Załóż darmowe konto treningowe</Text>

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
        placeholder="Hasło (min. 6 znaków)"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Powtórz hasło"
        placeholderTextColor="#999"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Zarejestruj się</Text>
        )}
      </TouchableOpacity>
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
  },
  button: {
    backgroundColor: "#17a2b8",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#93d3dd",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
