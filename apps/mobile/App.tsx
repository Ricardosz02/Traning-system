import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";

import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { TabNavigator } from "./src/navigation/TabNavigator";
import { CreatePlanScreen } from "./src/screens/CreatePlanScreen";
import { WorkoutCreatorScreen } from "./src/screens/WorkoutCreatorScreen";
import { PlanDetailsScreen } from "./src/screens/PlanDetailsScreen";

import { CustomPlanDetailsScreen } from "./src/screens/CustomPlanDetailsScreen";

import {
  AuthStackParamList,
  AppStackParamList,
} from "./src/types/navigation.types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const NavigationWrapper = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#17a2b8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <AppStack.Navigator>
          <AppStack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <AppStack.Screen
            name="CreatePlan"
            component={CreatePlanScreen}
            options={{ headerShown: false, presentation: "modal" }}
          />
          <AppStack.Screen
            name="WorkoutCreator"
            component={WorkoutCreatorScreen as any}
            options={{ headerShown: false, presentation: "modal" }}
          />
          <AppStack.Screen
            name="PlanDetails"
            component={PlanDetailsScreen}
            options={({ route }) => ({
              title: route.params.planName,
              headerBackTitle: "Wstecz",
            })}
          />

          <AppStack.Screen
            name="CustomPlanDetails"
            component={CustomPlanDetailsScreen}
            options={({ route }) => ({
              title: route.params.planName,
              headerBackTitle: "Wstecz",
            })}
          />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator initialRouteName="Login">
          <AuthStack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <AuthStack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Załóż konto" }}
          />
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
