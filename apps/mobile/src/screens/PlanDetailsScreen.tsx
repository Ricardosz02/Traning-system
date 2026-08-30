import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { fetchPlanDetails } from '../services/planService';
import { AppStackParamList } from '../types/navigation.types';

type PlanDetailsRouteProp = RouteProp<AppStackParamList, 'PlanDetails'>;

const DAY_NAMES: Record<number, string> = {
  1: 'Poniedziałek', 2: 'Wtorek', 3: 'Środa', 
  4: 'Czwartek', 5: 'Piątek', 6: 'Sobota', 7: 'Niedziela'
};

export const PlanDetailsScreen = () => {
  const route = useRoute<PlanDetailsRouteProp>();
  const { planId } = route.params;

  const [loading, setLoading] = useState(true);
  const [exercisesByDay, setExercisesByDay] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await fetchPlanDetails(planId);
        
        const grouped = data.reduce((acc: Record<number, any[]>, curr: any) => {
          const day = curr.day_of_week;
          if (!acc[day]) acc[day] = [];
          acc[day].push(curr);
          return acc;
        }, {});

        setExercisesByDay(grouped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [planId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#17a2b8" />
      </View>
    );
  }

  const activeDays = Object.keys(exercisesByDay).map(Number).sort((a, b) => a - b);

  return (
    <ScrollView style={styles.container}>
      {activeDays.length === 0 ? (
        <Text style={styles.emptyText}>Ten plan nie ma przypisanych żadnych ćwiczeń.</Text>
      ) : (
        activeDays.map((day) => (
          <View key={day} style={styles.dayContainer}>
            <Text style={styles.dayTitle}>{DAY_NAMES[day]}</Text>
            
            {exercisesByDay[day].map((item, index) => (
              <View key={item.id} style={styles.exerciseRow}>
                <View style={styles.orderCircle}>
                  <Text style={styles.orderText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.exercise?.name || 'Nieznane ćwiczenie'}</Text>
                  <Text style={styles.exerciseDetails}>
                    Serie: {item.target_sets} | Powtórzenia: {item.target_reps || 'Brak'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 16 },
  dayContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  dayTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  orderCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  orderText: { color: '#0284c7', fontWeight: 'bold', fontSize: 14 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  exerciseDetails: { fontSize: 13, color: '#666', marginTop: 2 }
});