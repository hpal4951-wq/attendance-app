import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, Avatar, Badge, ErrorView, LoadingScreen, AppCard, AttendanceStatus, EmptyState } from "../../components";
import wardenService from "../../services/wardenService";
import { getErrorMessage } from "../../utils/error";
import { useFetch, useFocusReload } from "../../hooks/useFetch";

export default function WardenStudentDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { studentId } = route.params || {};

  const { data: student, loading, error, reload, refresh, refreshing } = useFetch(
    () => wardenService.getStudentDetails(studentId),
    [studentId]
  );
  useFocusReload(reload);

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Student Details" showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const today = student?.today || [];
  const current = today.length ? today[today.length - 1] : null;

  const rows = [
    { label: "Student ID", value: student?.studentCode || "—" },
    { label: "Phone", value: student?.phone || "—" },
    { label: "Course", value: student?.course || "—" },
    { label: "Year", value: student?.year || "—" },
    { label: "Hostel", value: student?.hostel || "—" },
    { label: "Block", value: student?.block || "—" },
    { label: "Room", value: student?.roomNumber || "—" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Student Details" showBack onBack={() => navigation.goBack()} style={styles.header} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.profileCard}>
          <Avatar name={student?.name} size="lg" />
          <Text style={styles.name}>{student?.name || "Unknown"}</Text>
          <Badge label={student?.status || "active"} type={student?.status === "active" ? "success" : "info"} />
        </View>

        <AppCard style={styles.infoCard}>
          {rows.map((r) => (
            <View key={r.label} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </AppCard>

        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Current Status</Text>
            {current ? (
              <AttendanceStatus status={current.status} lastCheckedAt={current.lastCheckedAt} reason={current.reason} />
            ) : (
              <Text style={styles.summaryNone}>No attendance recorded yet</Text>
            )}
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Monthly Attendance</Text>
            <Text style={styles.summaryValue}>
              {student?.monthlyAttendance != null ? `${student.monthlyAttendance}%` : "—"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today's Records</Text>
        {today.length ? (
          today.map((r) => (
            <AppCard key={String(r.id)} padding={14} style={styles.recordCard}>
              <View style={styles.recordRow}>
                <Text style={styles.recordSlot}>{r.slot === "morning" ? "Morning" : "Night"}</Text>
                <AttendanceStatus status={r.status} lastCheckedAt={r.lastCheckedAt} reason={r.reason} compact />
              </View>
            </AppCard>
          ))
        ) : (
          <EmptyState emoji="🗓️" title="No records today" description="Attendance for today has not been recorded yet." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  profileCard: { alignItems: "center", marginBottom: SPACING.lg },
  name: { fontSize: FONT_SIZE.xxl, fontWeight: "800", color: COLORS.textPrimary, marginTop: SPACING.sm, marginBottom: 6 },
  infoCard: { marginBottom: SPACING.lg, padding: SPACING.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  rowValue: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.textPrimary, flex: 1, textAlign: "right", marginLeft: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.xs },
  summaryRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.md },
  summaryBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  summaryLabel: { fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: SPACING.sm },
  summaryValue: { fontSize: FONT_SIZE.xxxl, fontWeight: "900", color: COLORS.textPrimary },
  summaryNone: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  recordCard: { marginBottom: SPACING.sm },
  recordRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recordSlot: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.textPrimary },
});