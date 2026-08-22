import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WardenHome from "./WardenHome";

const Stack = createNativeStackNavigator();

/**
 * Warden flow navigator.
 * Screens will be added here in later prompts
 * (attendance review, student management, hostel operations, etc.).
 */
export default function WardenNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WardenHome" component={WardenHome} />
    </Stack.Navigator>
  );
}