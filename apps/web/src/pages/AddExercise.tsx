import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addExercise } from '../services/exerciseService';
import type { MuscleGroup, ExerciseCategory } from '../types/database.types';

export const AddExercise: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('STRENGTH');
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions: ExerciseCategory[] = ['STRENGTH', 'CALISTHENICS', 'CROSSFIT'];
  const muscleOptions: { label: string, value: MuscleGroup }[] = [
    { label: 'Klatka piersiowa', value: 'CHEST' },
    { label: 'Plecy', value: 'BACK' },
    { label: 'Nogi', value: 'LEGS' },
    { label: 'Barki', value: 'SHOULDERS' },
    { label: 'Ramiona', value: 'ARMS' },
    { label: 'Brzuch', value: 'CORE' },
  ];

  const handleMuscleToggle = (value: MuscleGroup) => {
    setMuscleGroups((prev) => 
      prev.includes(value) 
        ? prev.filter((m) => m !== value) 
        : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (muscleGroups.length === 0) {
      setError('Musisz wybrać co najmniej jedną grupę mięśniową.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addExercise({
        name,
        description,
        muscle_group: muscleGroups,
        category: category,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Wystąpił nieoczekiwany błąd.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Dodaj nowe ćwiczenie</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nazwa ćwiczenia *</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Kategoria *</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value as ExerciseCategory)} 
            style={{ width: '100%', padding: '8px' }}
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Grupy mięśniowe (zaznacz minimum jedną) *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {muscleOptions.map((option) => (
              <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={muscleGroups.includes(option.value)}
                  onChange={() => handleMuscleToggle(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Opis / Instrukcja</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={4}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red', backgroundColor: '#fee' }}>Błąd: {error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Zapisywanie...' : 'Zapisz ćwiczenie'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')}
            style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
};