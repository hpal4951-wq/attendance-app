import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";

import WardenDashboardScreen from "./WardenDashboardScreen";
import WardenStudentListScreen from "./WardenStudentListScreen";
import WardenStudentDetailsScreen from "./WardenStudentDetailsScreen";
import AttendanceMonitorScreen from "./AttendanceMonitorScreen";
import PendingAttendanceScreen from "./PendingAttendanceScreen";
import WardenProfileScreen from "./WardenProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WardenDashboard" component={WardenDashboardScreen} />
    </Stack.Navigator>
  );
}

function StudentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WardenStudentList" component={WardenStudentListScreen} />
      <Stack.Screen name="WardenStudentDetails" component={WardenStudentDetailsScreen} />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttendanceMonitor" component={AttendanceMonitorScreen} />
      <Stack.Screen name="PendingAttendance" component={PendingAttendanceScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WardenProfile" component={WardenProfileScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Dashboard: "grid",
  Students: "people",
  Attendance: "checkmark-circle",
  Profile: "person-circle",
};

export default function WardenNavigator() {
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
      <Tab.Screen name="Students" component={StudentsStack} />
      <Tab.Screen name="Attendance" component={AttendanceStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}