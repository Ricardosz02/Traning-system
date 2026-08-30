import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';
import { SetRow } from '../components/SetRow';
import { ExerciseSelectorModal } from '../components/ExerciseSelectorModal';
import { useAuth } from '../contexts/AuthContext';
import { saveWorkoutSession } from '../services/workoutService';

export const TrainingScreen = () => {
  const { user } = useAuth();
  const { isActive, startTime, startWorkout, endWorkout, exercises, addSet } = useWorkoutStore();
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFinishWorkout = async () => {
    if (!user?.id) {
      Alert.alert("Błąd autoryzacji", "Nie znaleziono aktywnej sesji użytkownika.");
      return;
    }

    if (!startTime) {
      Alert.alert("Błąd logiki", "Brak czasu rozpoczęcia treningu.");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("Uwaga", "Trening jest pusty, dodaj ćwiczenia przed zakończeniem.");
      return;
    }

    setIsSaving(true);
    
    try {
      const startedAt = startTime.toISOString();
      const endedAt = new Date().toISOString();

      await saveWorkoutSession(user.id, startedAt, endedAt, exercises);

      Alert.alert("Sukces", "Trening został pomyślnie zapisany!");
      endWorkout();
    } catch (error: any) {
      Alert.alert("Błąd zapisu treningu", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isActive) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Gotowy na trening?</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={startWorkout}>
          <Text style={styles.buttonText}>Rozpocznij Trening</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trening w toku</Text>
        <TouchableOpacity 
          style={[styles.dangerButton, isSaving && styles.disabledButton]} 
          onPress={handleFinishWorkout}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Zakończ i zapisz</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.workoutArea}>
        {exercises.length === 0 ? (
          <Text style={styles.emptyText}>Brak ćwiczeń. Dodaj pierwsze ćwiczenie!</Text>
        ) : (
          exercises.map((ex) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              
              <View style={styles.columnHeaders}>
                <Text style={styles.headerText}>Seria</Text>
                <Text style={styles.headerText}>Kg</Text>
                <Text style={styles.headerText}>Powt.</Text>
                <Text style={styles.headerText}>RPE</Text>
                <Text style={styles.headerText}>✔</Text>
              </View>

              {ex.sets.map((set, index) => (
                <SetRow 
                  key={set.id} 
                  exerciseId={ex.id} 
                  item={set} 
                  index={index} 
                />
              ))}

              <TouchableOpacity 
                style={styles.addSetButton} 
                onPress={() => addSet(ex.id)}
              >
                <Text style={styles.addSetText}>+ Dodaj serię</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.secondaryButtonText}>+ Dodaj Ćwiczenie z katalogu</Text>
        </TouchableOpacity>
      </ScrollView>

      <ExerciseSelectorModal 
        visible={isModalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  primaryButton: { backgroundColor: '#17a2b8', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10, marginTop: 20 },
  dangerButton: { backgroundColor: '#dc3545', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  disabledButton: { opacity: 0.7 },
  secondaryButton: { backgroundColor: '#e2e8f0', paddingVertical: 15, borderRadius: 10, alignItems: 'center', margin: 20 },
  secondaryButtonText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  workoutArea: { flex: 1 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 50 },
  exerciseCard: { backgroundColor: '#fff', padding: 15, marginHorizontal: 20, marginBottom: 15, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  exerciseName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  columnHeaders: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 5, paddingHorizontal: 5 },
  headerText: { fontSize: 12, color: '#999', fontWeight: 'bold', width: 40, textAlign: 'center' },
  addSetButton: { marginTop: 15, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 8 },
  addSetText: { color: '#17a2b8', fontWeight: 'bold' },
});