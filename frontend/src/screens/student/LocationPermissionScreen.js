import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppButton, Logo } from "../../components";
import locationService from "../../services/locationService";

export default function LocationPermissionScreen() {
  const navigation = useNavigation();
  const [permissionState, setPermissionState] = useState("checking"); // checking | granted | denied | blocked | servicesDisabled

  useEffect(() => {
    (async () => {
      const services = await locationService.checkLocationServices();
      if (!services) {
        setPermissionState("servicesDisabled");
        return;
      }
      const status = await locationService.checkLocationPermission();
      if (status === "granted") setPermissionState("granted");
      else if (status === "blocked") setPermissionState("blocked");
      else setPermissionState("denied");
    })();
  }, []);

  const handleAllow = async () => {
    setPermissionState("checking");
    const status = await locationService.requestLocationPermission();
    if (status === "granted") {
      setPermissionState("granted");
      setTimeout(() => navigation.goBack(), 600);
    } else if (status === "blocked") {
      setPermissionState("blocked");
    } else {
      setPermissionState("denied");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Location Permission" showBack onBack={() => navigation.goBack()} style={styles.header} />

      <ScrollView contentContainerStyle={styles.content}>
        <Logo size={80} />
        <Text style={styles.title}>Automatic Attendance</Text>
        <Text style={styles.description}>
          Location permission is required to automatically verify your hostel presence. Your location is only used to
          confirm that you are inside the hostel attendance area — you never need to mark attendance manually.
        </Text>

        {permissionState === "granted" ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusEmoji}>✅</Text>
            <Text style={styles.statusText}>Location permission granted.</Text>
          </View>
        ) : null}

        {permissionState === "denied" ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusEmoji}>⚠️</Text>
            <Text style={styles.statusText}>
              Location permission is required for automatic attendance.
            </Text>
          </View>
        ) : null}

        {permissionState === "blocked" ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusEmoji}>🚫</Text>
            <Text style={styles.statusText}>
              Permission is blocked. Please enable location for this app in your device settings.
            </Text>
          </View>
        ) : null}

        {permissionState === "servicesDisabled" ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusEmoji}>📴</Text>
            <Text style={styles.statusText}>
              Location services are turned off. Enable them to continue.
            </Text>
          </View>
        ) : null}

        <AppButton
          title="Allow Location"
          onPress={handleAllow}
          loading={permissionState === "checking"}
          disabled={permissionState === "checking"}
          style={styles.btn}
        />

        {permissionState === "blocked" ? (
          <AppButton
            title="Open Settings"
            variant="secondary"
            onPress={() => Linking.openSettings()}
            style={styles.btn}
          />
        ) : null}

        <AppButton
          title="Try Again"
          variant="ghost"
          onPress={handleAllow}
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  content: { padding: SPACING.xl, alignItems: "center" },
  title: { fontSize: FONT_SIZE.xxxl, fontWeight: "900", color: COLORS.textPrimary, marginTop: SPACING.xl, textAlign: "center" },
  description: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22, marginTop: SPACING.md, marginBottom: SPACING.xl },
  statusBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: "center", marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, width: "100%" },
  statusEmoji: { fontSize: 32, marginBottom: SPACING.sm },
  statusText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: "center" },
  btn: { width: "100%", marginBottom: SPACING.sm },
});