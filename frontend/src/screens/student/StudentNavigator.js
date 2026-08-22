import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StudentHome from "./StudentHome";

const Stack = createNativeStackNavigator();

/**
 * Student flow navigator.
 * Screens will be added here in later prompts
 * (attendance marking, mess polls, profile management, etc.).
 */
export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentHome" component={StudentHome} />
    </Stack.Navigator>
  );
}