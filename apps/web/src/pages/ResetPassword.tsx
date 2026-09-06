import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";

export const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Sesja odzyskiwania hasła została poprawnie nawiązana.");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Hasła nie są identyczne." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Hasło musi mieć co najmniej 6 znaków.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Hasło zostało pomyślnie zmienione! Możesz teraz zamknąć tę stronę i zalogować się w aplikacji mobilnej.",
        });
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Wystąpił nieoczekiwany błąd." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Ustaw nowe hasło</h2>
        <p style={styles.subtitle}>
          Wpisz i potwierdź swoje nowe hasło poniżej.
        </p>

        {message && (
          <div
            style={{
              ...styles.messageBox,
              backgroundColor:
                message.type === "success" ? "#d1e7dd" : "#f8d7da",
              color: message.type === "success" ? "#0f5132" : "#842029",
            }}
          >
            {message.text}
          </div>
        )}

        {message?.type !== "success" && (
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nowe hasło</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={styles.input}
                placeholder="Min. 6 znaków"
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Potwierdź nowe hasło</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                placeholder="Powtórz hasło"
                required
              />
            </div>
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Zapisywanie..." : "Zmień hasło"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "24px",
    color: "#333",
    textAlign: "center" as const,
  },
  subtitle: {
    margin: "0 0 20px 0",
    fontSize: "14px",
    color: "#666",
    textAlign: "center" as const,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "5px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "16px",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    backgroundColor: "#17a2b8",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  messageBox: {
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "20px",
    fontSize: "14px",
    textAlign: "center" as const,
  },
};
