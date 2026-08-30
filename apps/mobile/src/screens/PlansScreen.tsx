import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserPlans } from '../services/planService';
import { TrainingPlan } from '../types/database.types';
import { AppStackParamList } from '../types/navigation.types';

export const PlansScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlans = async () => {
    if (!user) return;
    try {
      const data = await fetchUserPlans(user.id);
      setPlans(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPlans();
    });
    return unsubscribe;
  }, [navigation, user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPlans();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Twoje Plany Treningowe</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('CreatePlan')}
        >
          <Text style={styles.addButtonText}>+ Nowy Plan</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#17a2b8" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          // @ts-ignore
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#17a2b8"]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Brak zapisanych planów. Utwórz swój pierwszy schemat!</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('PlanDetails', { planId: item.id, planName: item.name })}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDescription}>{item.description || 'Brak opisu'}</Text>
              <Text style={styles.cardDate}>
                Utworzono: {new Date(item.created_at).toLocaleDateString('pl-PL')}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  addButton: { backgroundColor: '#17a2b8', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 10 },
  cardDate: { fontSize: 12, color: '#999', textAlign: 'right' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 16 }
});