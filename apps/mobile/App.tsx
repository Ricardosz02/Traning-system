import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Exercise } from '@training-system/shared';

export default function App() {
  const testExercise: Exercise = {
    id: '1',
    name: 'Wyciskanie sztangi leżąc',
    muscleGroup: 'CHEST',
  };

  console.log('Zainicjowane ćwiczenie:', testExercise.name);

  return (
    <View style={styles.container}>
      <Text>Witaj w systemie treningowym!</Text>
      <Text>Aktywne ćwiczenie: {testExercise.name}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});