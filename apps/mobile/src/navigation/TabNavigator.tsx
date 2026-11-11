import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

import { TrainingScreen } from "../screens/TrainingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PlansScreen } from "../screens/PlansScreen";
import { MeasurementsScreen } from "../screens/MeasurementsScreen";
import { colors } from "../theme/colors";

export type TabParamList = {
  Plany: undefined;
  Trening: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const ProfileStack = createNativeStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfilGlowny"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Measurements"
        component={MeasurementsScreen}
        options={{ title: "Historia Wymiarów" }}
      />
    </ProfileStack.Navigator>
  );
};

export const TabNavigator = () => {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === "dark";
  const theme = isDark ? colors.dark : colors.light;

  return (
    <Tab.Navigator
      initialRouteName="Trening"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Plany") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Trening") {
            iconName = focused ? "barbell" : "barbell-outline";
          } else if (route.name === "Profil") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "help-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Plany" component={PlansScreen} />
      <Tab.Screen name="Trening" component={TrainingScreen} />
      <Tab.Screen name="Profil" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};
