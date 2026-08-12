import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const TrainingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aktywny Trening</Text>
      <Text style={styles.subtitle}>Logowanie ciężarów i RPE.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 10 },
});