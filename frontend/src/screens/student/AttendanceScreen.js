import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Linking, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppButton, AppCard } from "../../components";
import { ENABLE_TEST_LOCATION } from "../../constants/config";
import attendanceService from "../../services/attendanceService";
import locationService from "../../services/locationService";
import { getErrorMessage } from "../../utils/error";

// Dev-only fixed coordinates used to demo the automatic attendance flow.
// The backend still computes distance and decides the status.
const DEV_TEST_LOCATIONS = [
  { label: "At Hostel (Present)", latitude: 28.8387, longitude: 78.7732, accuracy: 10 },
  { label: "Far Away (Outside)", latitude: 29.0, longitude: 78.9, accuracy: 10 },
];

const RESULT_META = {
  present: {
    title: "Location Verified",
    message: "You are within the hostel attendance area.",
    color: COLORS.success,
    emoji: "✅",
  },
  outside_hostel: {
    title: "Outside Hostel Area",
    message: "You are outside the allowed attendance radius.",
    color: COLORS.danger,
    emoji: "⚠️",
  },
  location_unavailable: {
    title: "Location Unavailable",
    message: "Your location could not be verified.",
    color: COLORS.warning,
    emoji: "⚠️",
  },
  processing: {
    title: "Attendance Processing",
    message: "Your attendance is being processed automatically.",
    color: COLORS.info,
    emoji: "⏳",
  },
};

export default function AttendanceScreen() {
  // Clear state model: checking | permissionRequired | permissionBlocked |
  // servicesDisabled | processing | windowClosed | lowAccuracy | locationUnavailable |
  // networkError | result | error
  const [state, setState] = useState("checking");
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const runVerification = useCallback(async (mode = "initial", overrideLocation = null) => {
    if (mode === "refresh") setRefreshing(true);
    setErrorMsg("");
    setState("checking");
    setResult(null);

    try {
      let location;
      if (overrideLocation) {
        // Dev test: skip device location, send fixed coordinates.
        // The backend still decides the attendance status.
        location = overrideLocation;
      } else {
        const services = await locationService.checkLocationServices();
        if (!services) {
          setState("servicesDisabled");
          if (mode === "refresh") setRefreshing(false);
          return;
        }

        const permission = await locationService.checkLocationPermission();
        if (permission !== "granted") {
          setState(permission === "denied" || permission === "undetermined" ? "permissionRequired" : "permissionBlocked");
          if (mode === "refresh") setRefreshing(false);
          return;
        }

        location = await locationService.getCurrentLocation();
      }

      setState("processing");

      const res = await attendanceService.verifyLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        isMocked: location.isMocked || false,
      });

      setResult(res.data || res);
      setState("result");
    } catch (e) {
      if (e.code === "SERVICES_DISABLED") setState("servicesDisabled");
      else if (e.code === "PERMISSION_DENIED") setState("permissionRequired");
      else if (e.isNetwork) setState("networkError");
      else {
        const code = e?.data?.code;
        if (code === "ATTENDANCE_WINDOW_CLOSED") setState("windowClosed");
        else if (code === "LOCATION_ACCURACY_LOW") setState("lowAccuracy");
        else if (code === "LOCATION_UNAVAILABLE") setState("locationUnavailable");
        else {
          setErrorMsg(getErrorMessage(e));
          setState("error");
        }
      }
    } finally {
      if (mode === "refresh") setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      runVerification("initial");
    }, [runVerification])
  );

  const handleAllow = async () => {
    const status = await locationService.requestLocationPermission();
    if (status === "granted") {
      runVerification("initial");
    } else {
      setState("permissionBlocked");
    }
  };

  const meta = result ? RESULT_META[result.status] || RESULT_META.processing : RESULT_META.processing;

  const renderState = () => {
    switch (state) {
      case "checking":
        return (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateEmoji}>📍</Text>
            <Text style={styles.stateTitle}>Checking Location</Text>
            <Text style={styles.stateText}>Verifying your hostel location...</Text>
          </View>
        );

      case "permissionRequired":
        return (
          <View style={styles.centerBox}>
            <Text style={styles.stateEmoji}>📍</Text>
            <Text style={styles.stateTitle}>Location Permission Required</Text>
            <Text style={styles.stateText}>
              Location permission is required to automatically verify your hostel presence.
            </Text>
            <AppButton title="Allow Location" onPress={handleAllow} style={styles.actionBtn} />
          </View>
        );

      case "permissionBlocked":
        return (
          <View style={styles.centerBox}>
            <Text style={styles.stateEmoji}>🚫</Text>
            <Text style={styles.stateTitle}>Location Permission Blocked</Text>
            <Text style={styles.stateText}>
              Location permission is required for automatic attendance. Please enable it in your device settings.
            </Text>
            <AppButton title="Open Settings" onPress={() => Linking.openSettings()} style={styles.actionBtn} />
            <AppButton title="Try Again" variant="secondary" onPress={() => runVerification("initial")} style={styles.actionBtn} />
          </View>
        );

      case "servicesDisabled":
        return (
          <View style={styles.centerBox}>
            <Text style={styles.stateEmoji}>📴</Text>
            <Text style={styles.stateTitle}>Location Services Disabled</Text>
            <Text style={styles.stateText}>
              Your device location services are turned off. Enable them to verify your hostel presence.
            </Text>
            <AppButton title="Try Again" onPress={() => runVerification("initial")} style={styles.actionBtn} />
          </View>
        );

      case "processing":
        return (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.info} />
            <Text style={styles.stateEmoji}>⏳</Text>
            <Text style={styles.stateTitle}>Processing Attendance</Text>
            <Text style={styles.stateText}>Sending your verified location to the server...</Text>
          </View>
        );

      case "windowClosed":
        return (
          <View style={styles.centerBox}>
            <Text style={styles.stateEmoji}>🕐</Text>
            <Text style={styles.stateTitle}>Attendance Window Closed</Text>
            <Text style={styles.stateText}>
              Attendance verification is currently closed. Please check back during the attendance window.
            </Text>
            <AppButton title="Try Again" onPress={() => runVerification("initial")} style={styles.actionBtn} />
          </View>
        );

      case "lowAccuracy":
        return (
          <View style={styles.centerBox}>
            <Text style={styles.stateEmoji}>📡</Text>
            <Text style={styles.stateTitle}>Low Location Accuracy</Text>
            <Text style={styles.stateText}>
              Location accuracy is low. Please move to an open area and try again.
            </Text>
            <AppButton title="Retry" onPress={() => runVerification("initial")} style={styles.actionBtn} />
          </View>
        );

      case "locationUnavailable":
        return (
          <View style={styles.centerBox}>
            <Text style={styles.stateEmoji}>📍</Text>
            <Text style={styles.stateTitle}>Location Unavailable</Text>
            <Text style={styles.stateText}>
              Unable to get your location. Please try again.
            </Text>
            <AppButton title="Retry" onPress={() => runVerification("initial")} style={styles.actionBtn} />
          </View>
        );

      case "networkError":
        return (
          <View style={styles.centerBox}>
            <Text style={styles.stateEmoji}>📡</Text>
            <Text style={styles.stateTitle}>Connection Error</Text>
            <Text style={styles.stateText}>
              Unable to verify attendance. Please check your internet connection.
            </Text>
            <AppButton title="Retry" onPress={() => runVerification("initial")} style={styles.actionBtn} />
          </View>
        );

      case "result":
        return (
          <View>
            <AppCard style={[styles.resultCard, { borderLeftColor: meta.color, borderLeftWidth: 5 }]}>
              <Text style={styles.resultEmoji}>{meta.emoji}</Text>
              <Text style={[styles.resultTitle, { color: meta.color }]}>{meta.title}</Text>
              <Text style={styles.resultMessage}>{meta.message}</Text>
              {result?.reason ? <Text style={styles.resultReason}>{result.reason}</Text> : null}
            </AppCard>

            <AppCard style={styles.metaCard}>
              <View style={styles.metaRow}>
                <View style={styles.metaBox}>
                  <Text style={styles.metaValue}>{result?.distanceFromHostel ?? "—"} m</Text>
                  <Text style={styles.metaLabel}>Distance</Text>
                </View>
                <View style={styles.metaBox}>
                  <Text style={styles.metaValue}>{result?.allowedRadius ?? "—"} m</Text>
                  <Text style={styles.metaLabel}>Allowed radius</Text>
                </View>
              </View>
              {result?.accuracy != null ? (
                <Text style={styles.metaNote}>Location accuracy: {Math.round(result.accuracy)} m</Text>
              ) : null}
              {result?.verifiedAt ? (
                <Text style={styles.metaNote}>
                  Verified at: {new Date(result.verifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              ) : null}
            </AppCard>

            <AppButton
              title="Re-check Location"
              variant="secondary"
              onPress={() => runVerification("refresh")}
              loading={refreshing}
            />
          </View>
        );

      default:
        return (
          <View style={styles.centerBox}>
            <Text style={styles.stateEmoji}>❌</Text>
            <Text style={styles.stateTitle}>Something went wrong</Text>
            <Text style={styles.stateText}>{errorMsg || "Unable to verify your location."}</Text>
            <AppButton title="Try Again" onPress={() => runVerification("initial")} style={styles.actionBtn} />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Attendance" subtitle="Automatic hostel presence verification" style={styles.header} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => runVerification("refresh")}
          />
        }
      >
        <Text style={styles.note}>
          Attendance is verified automatically from your location. You do not need to mark it manually.
        </Text>
        {renderState()}
        {ENABLE_TEST_LOCATION ? <DevTestSection onTest={runVerification} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DevTestSection({ onTest }) {
  return (
    <View style={styles.devBox}>
      <Text style={styles.devTitle}>Test Location</Text>
      <Text style={styles.devText}>
        Send fixed coordinates to the backend. The backend still calculates distance and decides the attendance status.
      </Text>
      {DEV_TEST_LOCATIONS.map((t) => (
        <AppButton
          key={t.label}
          title={t.label}
          variant="secondary"
          onPress={() => onTest("refresh", { latitude: t.latitude, longitude: t.longitude, accuracy: t.accuracy, isMocked: false })}
          style={styles.devBtn}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  note: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: "center", marginBottom: SPACING.lg },
  centerBox: { alignItems: "center", paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.lg },
  stateEmoji: { fontSize: 44, marginTop: SPACING.lg, marginBottom: SPACING.md },
  stateTitle: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center" },
  stateText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22, marginTop: SPACING.sm, marginBottom: SPACING.xl },
  actionBtn: { minWidth: 200, marginTop: SPACING.sm },
  resultCard: { alignItems: "center", padding: SPACING.xl, marginBottom: SPACING.md },
  resultEmoji: { fontSize: 44, marginBottom: SPACING.sm },
  resultTitle: { fontSize: FONT_SIZE.xxl, fontWeight: "900" },
  resultMessage: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: "center", marginTop: SPACING.sm },
  resultReason: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: "center", marginTop: SPACING.sm },
  metaCard: { padding: SPACING.lg, marginBottom: SPACING.md },
  metaRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.sm },
  metaBox: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, alignItems: "center" },
  metaValue: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.textPrimary },
  metaLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },
  metaNote: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  devBox: { marginTop: SPACING.xl, padding: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, borderStyle: "dashed" },
  devTitle: { fontSize: FONT_SIZE.md, fontWeight: "800", color: COLORS.warning, marginBottom: SPACING.sm },
  devText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },
  devBtn: { marginBottom: SPACING.sm },
});