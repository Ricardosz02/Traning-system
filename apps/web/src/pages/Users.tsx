import React, { useEffect, useState } from 'react';
import { getProfiles } from '../services/userService';
import type { Profile } from '../types/database.types';
import { useNavigate } from 'react-router-dom';

export const Users: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getProfiles();
        setProfiles(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Wystąpił nieoczekiwany błąd podczas pobierania użytkowników.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Ładowanie listy użytkowników...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Błąd: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Panel Administratora - Użytkownicy</h2>
      <button 
        onClick={() => navigate('/dashboard')}
        style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', marginBottom: '15px', cursor: 'pointer' }}
      >
        Powrót do bazy ćwiczeń
      </button>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>ID (UUID)</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Adres E-mail</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Rola</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Data rejestracji</th>
          </tr>
        </thead>
        <tbody>
          {profiles.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>
                Brak zarejestrowanych użytkowników.
              </td>
            </tr>
          ) : (
            profiles.map((profile) => (
              <tr key={profile.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', fontSize: '0.85em', color: '#555' }}>{profile.id}</td>
                <td style={{ padding: '10px' }}><strong>{profile.email}</strong></td>
                <td style={{ padding: '10px' }}>
                  <span style={{ 
                    padding: '3px 8px', 
                    backgroundColor: profile.role === 'ADMIN' ? '#dc3545' : '#17a2b8', 
                    color: 'white', 
                    borderRadius: '12px',
                    fontSize: '0.9em'
                  }}>
                    {profile.role}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{new Date(profile.created_at).toLocaleString('pl-PL')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};