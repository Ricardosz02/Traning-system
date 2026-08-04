import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

export const Dashboard: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<string>('Łączenie z bazą danych...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('exercises').select('*').limit(1);

        if (error) {
          console.error('Błąd Supabase:', error);
          setDbStatus(`Błąd połączenia: ${error.message}`);
        } else {
          console.log('Połączono pomyślnie. Otrzymane dane:', data);
          setDbStatus('Połączenie z Supabase aktywne');
        }
      } catch (err) {
        console.error('Krytyczny błąd:', err);
        setDbStatus('Błąd infrastruktury sieciowej.');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Panel Główny</h2>
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <p>Status integracji: <strong>{dbStatus}</strong></p>
      </div>
    </div>
  );
};