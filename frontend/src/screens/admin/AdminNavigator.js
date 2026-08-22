import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";

import AdminDashboardScreen from "./AdminDashboardScreen";
import HostelManagementScreen from "./HostelManagementScreen";
import AddHostelScreen from "./AddHostelScreen";
import BlockManagementScreen from "./BlockManagementScreen";
import AddBlockScreen from "./AddBlockScreen";
import RoomManagementScreen from "./RoomManagementScreen";
import AddRoomScreen from "./AddRoomScreen";
import StudentManagementScreen from "./StudentManagementScreen";
import AddStudentScreen from "./AddStudentScreen";
import StudentDetailsScreen from "./StudentDetailsScreen";
import ChangeRoomScreen from "./ChangeRoomScreen";
import WardenManagementScreen from "./WardenManagementScreen";
import AddWardenScreen from "./AddWardenScreen";
import AdminProfileScreen from "./AdminProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={AdminDashboardScreen} />
    </Stack.Navigator>
  );
}

function StudentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentList" component={StudentManagementScreen} />
      <Stack.Screen name="AddStudent" component={AddStudentScreen} />
      <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} />
      <Stack.Screen name="ChangeRoom" component={ChangeRoomScreen} />
    </Stack.Navigator>
  );
}

function HostelStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HostelList" component={HostelManagementScreen} />
      <Stack.Screen name="AddHostel" component={AddHostelScreen} />
      <Stack.Screen name="BlockList" component={BlockManagementScreen} />
      <Stack.Screen name="AddBlock" component={AddBlockScreen} />
      <Stack.Screen name="RoomList" component={RoomManagementScreen} />
      <Stack.Screen name="AddRoom" component={AddRoomScreen} />
    </Stack.Navigator>
  );
}

function WardensStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WardenList" component={WardenManagementScreen} />
      <Stack.Screen name="AddWarden" component={AddWardenScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Dashboard: "grid",
  Students: "people",
  Hostel: "business",
  Wardens: "shield-checkmark",
  Profile: "person-circle",
};

export default function AdminNavigator() {
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
      <Tab.Screen name="Hostel" component={HostelStack} />
      <Tab.Screen name="Wardens" component={WardensStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
