import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExerciseById, updateExercise } from '../services/exerciseService';
import type { MuscleGroup, ExerciseCategory } from '../types/database.types';

export const EditExercise: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('STRENGTH');
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions: ExerciseCategory[] = ['STRENGTH', 'CALISTHENICS', 'CROSSFIT'];
  const muscleOptions: { label: string, value: MuscleGroup, category: string }[] = [
    { label: 'Klatka piersiowa', value: 'CHEST', category: 'Góra' },
    
    { label: 'Plecy - Najszerszy', value: 'BACK_LATS', category: 'Góra' },
    { label: 'Plecy - Czworoboczne', value: 'BACK_TRAPS', category: 'Góra' },
    { label: 'Plecy - Prostowniki', value: 'BACK_ERECTORS', category: 'Góra' },
    
    { label: 'Barki - Przód', value: 'SHOULDERS_FRONT', category: 'Góra' },
    { label: 'Barki - Środek', value: 'SHOULDERS_MID', category: 'Góra' },
    { label: 'Barki - Tył', value: 'SHOULDERS_REAR', category: 'Góra' },
    
    { label: 'Biceps', value: 'BICEPS', category: 'Góra' },
    { label: 'Triceps', value: 'TRICEPS', category: 'Góra' },
    { label: 'Przedramiona', value: 'FOREARMS', category: 'Góra' },
    
    { label: 'Brzuch - Prosty', value: 'ABS_RECTUS', category: 'Środek' },
    { label: 'Brzuch - Skośne', value: 'ABS_OBLIQUES', category: 'Środek' },
    { label: 'Brzuch - Poprzeczny', value: 'ABS_TRANSVERSE', category: 'Środek' },
    
    { label: 'Nogi - Czworogłowy (przód)', value: 'QUADS', category: 'Dół' },
    { label: 'Nogi - Dwugłowy (tył)', value: 'HAMSTRINGS', category: 'Dół' },
    { label: 'Pośladki', value: 'GLUTES', category: 'Dół' },
    { label: 'Łydki', value: 'CALVES', category: 'Dół' },
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!id) return;
      try {
        const exerciseData = await getExerciseById(id);
        setName(exerciseData.name);
        setDescription(exerciseData.description || '');
        setCategory(exerciseData.category);
        setMuscleGroups(exerciseData.muscle_group || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Nie udało się załadować danych ćwiczenia.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const handleMuscleToggle = (value: MuscleGroup) => {
    setMuscleGroups((prev) => 
      prev.includes(value) 
        ? prev.filter((m) => m !== value) 
        : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (muscleGroups.length === 0) {
      setError('Musisz wybrać co najmniej jedną grupę mięśniową.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateExercise(id, {
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
        setError('Wystąpił nieoczekiwany błąd podczas zapisu.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Ładowanie danych...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Edytuj ćwiczenie</h2>
      
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
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Grupy mięśniowe *</label>
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
            disabled={saving}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {saving ? 'Zapisywanie...' : 'Zaktualizuj ćwiczenie'}
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