import React, { useEffect, useState } from 'react';
import { getExercises } from '../services/exerciseService';
import type { Exercise } from '../types/database.types';

export const Dashboard: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          setError('Wystąpił nieoczekiwany błąd podczas pobierania danych.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Ładowanie listy ćwiczeń...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Błąd: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Panel Administratora - Baza Ćwiczeń</h2>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Nazwa</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Grupa mięśniowa</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Poziom</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Opis</th>
          </tr>
        </thead>
        <tbody>
          {exercises.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>
                Brak ćwiczeń w bazie danych.
              </td>
            </tr>
          ) : (
            exercises.map((exercise) => (
              <tr key={exercise.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}><strong>{exercise.name}</strong></td>
                <td style={{ padding: '10px' }}>{exercise.muscle_group}</td>
                <td style={{ padding: '10px' }}>{exercise.difficulty_level}</td>
                <td style={{ padding: '10px' }}>{exercise.description}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};