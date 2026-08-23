import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";

import StudentDashboardScreen from "./StudentDashboardScreen";
import AttendanceScreen from "./AttendanceScreen";
import AttendanceHistoryScreen from "./AttendanceHistoryScreen";
import StudentProfileScreen from "./StudentProfileScreen";
import LocationPermissionScreen from "./LocationPermissionScreen";
import StudentMessScreen from "./StudentMessScreen";
import MessMenuScreen from "./MessMenuScreen";
import ActivePollsScreen from "./ActivePollsScreen";
import PollDetailsScreen from "./PollDetailsScreen";
import PollResultsScreen from "./PollResultsScreen";
import FoodSuggestionScreen from "./FoodSuggestionScreen";
import MySuggestionsScreen from "./MySuggestionsScreen";
import PollHistoryScreen from "./PollHistoryScreen";
import NotificationsScreen from "../common/NotificationsScreen";
import HelpScreen from "../common/HelpScreen";
import AboutScreen from "../common/AboutScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
    </Stack.Navigator>
  );
}

function MessStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MessHome" component={StudentMessScreen} />
      <Stack.Screen name="MessMenu" component={MessMenuScreen} />
      <Stack.Screen name="ActivePolls" component={ActivePollsScreen} />
      <Stack.Screen name="PollDetails" component={PollDetailsScreen} />
      <Stack.Screen name="PollResults" component={PollResultsScreen} />
      <Stack.Screen name="FoodSuggestion" component={FoodSuggestionScreen} />
      <Stack.Screen name="MySuggestions" component={MySuggestionsScreen} />
      <Stack.Screen name="PollHistory" component={PollHistoryScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Dashboard: "grid",
  Attendance: "location",
  Mess: "restaurant",
  History: "calendar",
  Profile: "person-circle",
};

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Attendance" component={AttendanceStack} />
      <Tab.Screen name="Mess" component={MessStack} />
      <Tab.Screen name="History" component={HistoryStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}