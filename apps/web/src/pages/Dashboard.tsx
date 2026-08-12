import React, { useEffect, useState } from "react";
import { getExercises, deleteExercise } from "../services/exerciseService";
import type { Exercise } from "../types/database.types";
import { useNavigate } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const data = await getExercises();
        setExercises(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Wystąpił nieoczekiwany błąd podczas pobierania danych.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `Czy na pewno chcesz usunąć ćwiczenie: ${name}?`,
    );

    if (!isConfirmed) return;

    try {
      await deleteExercise(id);
      setExercises((prevExercises) =>
        prevExercises.filter((ex) => ex.id !== id),
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Błąd: ${err.message}`);
      } else {
        alert("Wystąpił nieoczekiwany błąd podczas usuwania.");
      }
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Ładowanie listy ćwiczeń...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "red" }}>Błąd: {error}</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Panel Administratora - Baza Ćwiczeń</h2>
      <button
        onClick={() => navigate("/add-exercise")}
        style={{
          padding: "10px 15px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          marginBottom: "15px",
          cursor: "pointer",
        }}
      >
        + Dodaj nowe ćwiczenie
      </button>
      <button
        onClick={() => navigate("/users")}
        style={{
          padding: "10px 15px",
          backgroundColor: "#17a2b8",
          color: "white",
          border: "none",
          marginBottom: "15px",
          marginLeft: "10px",
          cursor: "pointer",
        }}
      >
        Zarządzaj użytkownikami
      </button>

      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f4f4f4", textAlign: "left" }}>
            <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>
              Nazwa
            </th>
            <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>
              Grupa mięśniowa
            </th>
            <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>
              Poziom
            </th>
            <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>
              Opis
            </th>
            <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>
              Akcje
            </th>
          </tr>
        </thead>
        <tbody>
          {exercises.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: "20px", textAlign: "center" }}>
                Brak ćwiczeń w bazie danych.
              </td>
            </tr>
          ) : (
            exercises.map((exercise) => (
              <tr key={exercise.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>
                  <strong>{exercise.name}</strong>
                </td>
                <td style={{ padding: "10px" }}>{exercise.muscle_group}</td>
                <td style={{ padding: "10px" }}>{exercise.category}</td>
                <td style={{ padding: "10px" }}>{exercise.description}</td>
                <td style={{ padding: "10px" }}>
                  <button
                    onClick={() => navigate(`/edit-exercise/${exercise.id}`)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#ffc107",
                      color: "black",
                      border: "none",
                      cursor: "pointer",
                      marginRight: "5px",
                    }}
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDelete(exercise.id, exercise.name)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
