import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../screens/auth/SplashScreen";
import AuthNavigator from "./AuthNavigator";
import AdminNavigator from "../screens/admin/AdminNavigator";
import WardenNavigator from "../screens/warden/WardenNavigator";
import StudentNavigator from "../screens/student/StudentNavigator";

/**
 * Root navigator — the single source of truth for which screen is visible.
 *
 * Flow:
 *   loading  → SplashScreen (branded loading screen while session restores)
 *   no auth  → AuthNavigator (Login)
 *   auth     → role-based navigator (Admin / Warden / Student)
 */
export default function AppNavigator() {
  const { user, loading, isAuthenticated } = useAuth();

  // Show branded splash screen while restoring session from storage
  if (loading) {
    return <SplashScreen />;
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
