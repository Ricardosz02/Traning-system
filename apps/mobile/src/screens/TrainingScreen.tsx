import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export const TrainingScreen = () => {
  const { isActive, startWorkout, endWorkout, exercises, addExercise } = useWorkoutStore();

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
        <TouchableOpacity style={styles.dangerButton} onPress={endWorkout}>
          <Text style={styles.buttonText}>Zakończ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.workoutArea}>
        {exercises.length === 0 ? (
          <Text style={styles.emptyText}>Brak ćwiczeń. Dodaj pierwsze ćwiczenie!</Text>
        ) : (
          exercises.map((ex) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => addExercise('mock-id', 'Wyciskanie sztangi leżąc')}
        >
          <Text style={styles.secondaryButtonText}>+ Dodaj Ćwiczenie</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8f9fa' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa', 
    paddingTop: 50 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 20, 
    alignItems: 'center' 
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  primaryButton: { 
    backgroundColor: '#17a2b8', 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 10, 
    marginTop: 20 
  },
  dangerButton: { 
    backgroundColor: '#dc3545', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 8 
  },
  secondaryButton: { 
    backgroundColor: '#e2e8f0', 
    paddingVertical: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    margin: 20 
  },
  secondaryButtonText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  workoutArea: { flex: 1 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 50 },
  exerciseCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    marginHorizontal: 20, 
    marginBottom: 15, 
    borderRadius: 10, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    shadowOffset: { width: 0, height: 2 } 
  },
  exerciseName: { fontSize: 18, fontWeight: 'bold', color: '#333' }
});