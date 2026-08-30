import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { TrainingScreen } from '../screens/TrainingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PlansScreen } from '../screens/PlansScreen';

export type TabParamList = {
  Katalog: undefined;
  Plany: undefined;
  Trening: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Katalog') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Plany') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Trening') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#17a2b8',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Katalog" component={HomeScreen} />
      <Tab.Screen name="Plany" component={PlansScreen} />
      <Tab.Screen name="Trening" component={TrainingScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};