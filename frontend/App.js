import React from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppErrorBoundary, NetworkStatusBanner } from "./src/components";

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <StatusBar style="dark" />
        <NetworkStatusBanner />
        <AppNavigator />
      </AuthProvider>
    </AppErrorBoundary>
  );
}