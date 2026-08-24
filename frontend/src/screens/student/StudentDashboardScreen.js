import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Pressable, AppState, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { AppHeader, AppCard, ErrorView, LoadingScreen, AttendanceStatus, AppButton, NotificationBell, MenuCard } from "../../components";
import attendanceService from "../../services/attendanceService";
import analyticsService from "../../services/analyticsService";
import pollService from "../../services/pollService";
import menuService from "../../services/menuService";
import locationService from "../../services/locationService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function toDisplayStatus(latest) {
  if (!latest) return "processing";
  if (latest.status === "present") return "present";
  if (latest.status === "absent") return "outside_hostel";
  return "pending";
}

// Minimum gap between automatic verification attempts (ms).
const VERIFY_COOLDOWN_MS = 30000;

export default function StudentDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const { data, loading, error, refresh, refreshing, reload } = useFetch(
    () => attendanceService.getTodayAttendance(),
    []
  );
  const statsRes = useFetch(() => analyticsService.getStudentAnalytics(), []);
  const pollsRes = useFetch(() => pollService.getActivePolls(), []);
  const menuRes = useFetch(() => menuService.getMenu(), []);

  const latestPoll = (pollsRes.data || [])[0] || null;
  const todayLunch = (menuRes.data?.menu || []).find((m) => m.mealType === "lunch") || null;

  const [permissionGranted, setPermissionGranted] = useState(true);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");
  const [gpsCode, setGpsCode] = useState(null);

  // Mirrors the latest today-attendance payload for stable auto-verify callback.
  const todayDataRef = useRef(data);
  useEffect(() => {
    todayDataRef.current = data;
  }, [data]);

  // Session-level guards: never spam verify-location, never verify after present.
  const verifyingRef = useRef(false);
  const lastAttemptRef = useRef(0);

  const attemptAutoVerification = useCallback(async () => {
    if (verifyingRef.current) return;
    if (Date.now() - lastAttemptRef.current < VERIFY_COOLDOWN_MS) return;
    lastAttemptRef.current = Date.now();

    const today = todayDataRef.current || {};
    const latest = (today.records || [])[0];
    if (latest && latest.status === "present") return;

    let permission;
    try {
      permission = await locationService.checkLocationPermission();
    } catch {
      permission = "denied";
    }
    if (permission !== "granted") {
      setPermissionGranted(false);
      return;
    }
    setPermissionGranted(true);

    verifyingRef.current = true;
    setVerifying(true);
    setGpsMessage("");
    try {
      const loc = await locationService.getCurrentLocation();
      const res = await attendanceService.verifyLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        isMocked: loc.isMocked || false,
      });
      const d = res.data || res;
      setGpsCode(d.code || null);
      if (d.status === "present") {
        setGpsMessage("");
        reload();
      } else {
        setGpsMessage(
          d.status === "outside_hostel"
            ? "You are outside the hostel attendance area."
            : d.reason || "Attendance could not be verified."
        );
      }
      statsRes.reload();
    } catch (e) {
      if (e.code === "SERVICES_DISABLED") {
        setGpsCode("SERVICES_DISABLED");
        setGpsMessage("Location services are disabled. Enable them to verify attendance.");
      } else if (e.code === "PERMISSION_DENIED") {
        setPermissionGranted(false);
      } else {
        setGpsCode(e?.data?.code || "VERIFY_FAILED");
        setGpsMessage(getErrorMessage(e, "Unable to verify attendance. Please check your internet connection."));
      }
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }, [reload, statsRes.reload]);

  // Auto-verify when the Dashboard becomes active.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const status = await locationService.checkLocationPermission();
        if (!active) return;
        setPermissionGranted(status === "granted");
        setCheckingPermission(false);
        if (status === "granted") {
          attemptAutoVerification();
        }
      })();
      return () => {
        active = false;
      };
    }, [attemptAutoVerification])
  );

  // Controlled re-verification when the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        attemptAutoVerification();
      }
    });
    return () => sub.remove();
  }, [attemptAutoVerification]);

  const firstName = (user?.name || "Student").split(" ")[0];
  const student = data?.student || {};
  const hostel = student.hostel || {};
  const block = student.block || {};
  const room = student.room || {};
  const records = data?.records || [];
  const latest = records[0] || null;
  const displayStatus = toDisplayStatus(latest);

  const infoCard = [
    { label: "Student ID", value: student.studentCode || "—" },
    { label: "Hostel", value: hostel.name || "—" },
    { label: "Block", value: block.name || "—" },
    { label: "Room", value: room.roomNumber || "—" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={`${getGreeting()}, ${firstName} 👋`}
        subtitle="Smart Hostel Attendance"
        style={styles.header}
        rightAction={<NotificationBell navigation={navigation} />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {checkingPermission ? (
          <LoadingScreen message="Checking location permission..." />
        ) : loading ? (
          <LoadingScreen message="Loading..." />
        ) : error ? (
          <ErrorView message={getErrorMessage(error)} onRetry={reload} />
        ) : (
          <>
            {!permissionGranted ? (
              <AppCard style={styles.permissionCard}>
                <Text style={styles.permissionTitle}>Location permission required</Text>
                <Text style={styles.permissionText}>
                  Automatic attendance needs your location. Grant permission to verify your hostel presence.
                </Text>
                <AppButton
                  title="Allow Location"
                  onPress={() => navigation.navigate("Attendance", { screen: "LocationPermission" })}
                />
              </AppCard>
            ) : null}

            <Text style={styles.sectionTitle}>Today's Attendance</Text>
            <AppCard style={styles.statusCard}>
              {verifying ? (
                <View style={styles.verifyingRow}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.verifyingText}>Checking your location...</Text>
                </View>
              ) : (
                <AttendanceStatus
                  status={displayStatus}
                  lastCheckedAt={latest?.markedAt || null}
                  reason={latest?.reason || null}
                />
              )}
              {gpsMessage ? <Text style={styles.gpsMessage}>{gpsMessage}</Text> : null}
              {latest ? (
                <View style={styles.metaRow}>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaValue}>{latest.distanceFromHostel ?? "—"} m</Text>
                    <Text style={styles.metaLabel}>Distance</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaValue}>
                      {data?.allowedRadius ?? hostel.radiusMeters ?? "—"} m
                    </Text>
                    <Text style={styles.metaLabel}>Allowed radius</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.processingText}>
                  Your attendance is being processed automatically.
                </Text>
              )}
            </AppCard>

            <Text style={styles.sectionTitle}>My Details</Text>
            <AppCard style={styles.infoCard}>
              {infoCard.map((r) => (
                <View key={r.label} style={styles.row}>
                  <Text style={styles.rowLabel}>{r.label}</Text>
                  <Text style={styles.rowValue}>{r.value}</Text>
                </View>
              ))}
            </AppCard>

            {statsRes.data?.monthlyAttendancePercent != null ? (
              <AppCard style={styles.metaCard}>
                <Text style={styles.metaLabel}>Monthly Attendance</Text>
                <Text style={styles.metaValue}>{statsRes.data.monthlyAttendancePercent}%</Text>
              </AppCard>
            ) : null}

            {todayLunch?.items?.length ? (
              <MenuCard mealType="lunch" items={todayLunch.items} />
            ) : null}

            {latestPoll ? (
              <AppCard style={styles.metaCard}>
                <View style={styles.pollHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLabel}>New Poll</Text>
                    <Text style={styles.pollQuestion}>{latestPoll.question}</Text>
                  </View>
                  <AppButton
                    title={latestPoll.hasVoted ? "View" : "Vote Now"}
                    variant="primary"
                    onPress={() => navigation.navigate("Mess", { screen: "PollDetails", params: { pollId: latestPoll._id } })}
                  />
                </View>
              </AppCard>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.viewHistoryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate("History", { screen: "AttendanceHistory" })}
            >
              <Text style={styles.viewHistoryText}>View Attendance History →</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  permissionCard: { marginBottom: SPACING.lg },
  permissionTitle: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.warning, marginBottom: SPACING.sm },
  permissionText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.xs },
  statusCard: { marginBottom: SPACING.lg },
  verifyingRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  verifyingText: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.textSecondary },
  gpsMessage: { fontSize: FONT_SIZE.sm, color: COLORS.warning, marginTop: SPACING.sm },
  metaRow: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.lg },
  metaBox: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, alignItems: "center" },
  metaValue: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.textPrimary },
  metaLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },
  processingText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.md },
  infoCard: { padding: SPACING.lg, marginBottom: SPACING.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  rowValue: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.textPrimary, flex: 1, textAlign: "right", marginLeft: SPACING.md },
  viewHistoryBtn: { paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryLight, alignItems: "center" },
  viewHistoryText: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.primary },
  metaCard: { padding: 16, marginBottom: 12 },
  pollHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  pollQuestion: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, marginTop: 4 },
});
