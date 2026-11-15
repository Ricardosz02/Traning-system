import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { TrainingScreen } from "../screens/TrainingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PlansScreen } from "../screens/PlansScreen";
import { MeasurementsScreen } from "../screens/MeasurementsScreen";
import { colors } from "../theme/colors";
import { useThemeStore } from "../store/themeStore";

export type TabParamList = {
  Plany: undefined;
  Trening: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const ProfileStack = createNativeStackNavigator();

const AnimatedTabWrapper = ({ children }: { children: React.ReactNode }) => {
  const isFocused = useIsFocused();
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      opacity.setValue(0.2);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, opacity]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>
    </View>
  );
};

const AnimatedPlansScreen = () => (
  <AnimatedTabWrapper>
    <PlansScreen />
  </AnimatedTabWrapper>
);

const AnimatedTrainingScreen = () => (
  <AnimatedTabWrapper>
    <TrainingScreen />
  </AnimatedTabWrapper>
);

const ProfileStackNavigator = () => {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <AnimatedTabWrapper>
      <ProfileStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.primary,
          headerTitleStyle: {
            color: theme.text,
          },
          headerShadowVisible: false,
          headerBackTitle: "",
        }}
      >
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
    </AnimatedTabWrapper>
  );
};

export const TabNavigator = () => {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <Tab.Navigator
      initialRouteName="Trening"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "help-outline";

          if (route.name === "Plany") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Trening") {
            iconName = focused ? "barbell" : "barbell-outline";
          } else if (route.name === "Profil") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.65)",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: theme.primary,
          borderTopWidth: 0,
          elevation: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Plany" component={AnimatedPlansScreen} />
      <Tab.Screen name="Trening" component={AnimatedTrainingScreen} />
      <Tab.Screen name="Profil" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};
