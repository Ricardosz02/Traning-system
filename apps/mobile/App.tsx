import React from "react";
import { ActivityIndicator, View } from "react-native";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { useThemeStore } from "./src/store/themeStore";
import { colors } from "./src/theme/colors";

import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { TabNavigator } from "./src/navigation/TabNavigator";
import { CreatePlanScreen } from "./src/screens/CreatePlanScreen";
import { WorkoutCreatorScreen } from "./src/screens/WorkoutCreatorScreen";
import { PlanDetailsScreen } from "./src/screens/PlanDetailsScreen";
import { CustomPlanDetailsScreen } from "./src/screens/CustomPlanDetailsScreen";
import AiGeneratorScreen from "./src/screens/AiGeneratorScreen";

import {
  AuthStackParamList,
  AppStackParamList,
} from "./src/types/navigation.types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const NavigationWrapper = () => {
  const { session, isLoading } = useAuth();
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const navigationTheme = isDarkMode
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          primary: theme.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          primary: theme.primary,
        },
      };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {session ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="MainTabs" component={TabNavigator} />
          <AppStack.Screen
            name="CreatePlan"
            component={CreatePlanScreen}
            options={{ presentation: "modal" }}
          />
          <AppStack.Screen
            name="WorkoutCreator"
            component={WorkoutCreatorScreen as any}
            options={{ presentation: "modal" }}
          />
          <AppStack.Screen
            name={"AiGeneratorScreen" as keyof AppStackParamList}
            component={AiGeneratorScreen as any}
            options={{ presentation: "modal" }}
          />
          <AppStack.Screen name="PlanDetails" component={PlanDetailsScreen} />
          <AppStack.Screen
            name="CustomPlanDetails"
            component={CustomPlanDetailsScreen}
          />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationWrapper />
    </AuthProvider>
  );
}
