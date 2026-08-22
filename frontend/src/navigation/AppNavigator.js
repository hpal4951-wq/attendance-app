import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components";
import AuthNavigator from "./AuthNavigator";
import AdminNavigator from "../screens/admin/AdminNavigator";
import WardenNavigator from "../screens/warden/WardenNavigator";
import StudentNavigator from "../screens/student/StudentNavigator";

export default function AppNavigator() {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading screen while restoring session
  if (loading) {
    return <LoadingScreen message="Restoring session..." />;
  }

  // Not authenticated — show login
  if (!isAuthenticated || !user) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Authenticated — route based on role
  return (
    <NavigationContainer>
      {user.role === "admin" && <AdminNavigator />}
      {user.role === "warden" && <WardenNavigator />}
      {user.role === "student" && <StudentNavigator />}
    </NavigationContainer>
  );
}
