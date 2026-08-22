import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { AppHeader, StatCard, ErrorView, LoadingScreen } from "../../components";
import wardenService from "../../services/wardenService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function WardenDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const { data, loading, error, refresh, refreshing, reload } = useFetch(
    () => wardenService.getWardenDashboard(),
    []
  );

  const firstName = (user?.name || "Warden").split(" ")[0];
  const hostelName = data?.hostel?.name;
  const blockName = data?.block?.name;

  const stats = [
    { label: "Total Students", value: data?.totalStudents ?? 0, icon: "👨‍🎓", color: COLORS.primary },
    { label: "Present", value: data?.present ?? 0, icon: "✓", color: COLORS.success },
    { label: "Absent", value: data?.absent ?? 0, icon: "✕", color: COLORS.danger },
    { label: "Pending", value: data?.pending ?? 0, icon: "⏳", color: COLORS.warning },
  ];

  const quickActions = [
    { label: "Students", icon: "👨‍🎓", onPress: () => navigation.navigate("Students", { screen: "WardenStudentList" }) },
    { label: "Attendance Monitor", icon: "📊", onPress: () => navigation.navigate("Attendance", { screen: "AttendanceMonitor" }) },
    { label: "Pending Attendance", icon: "⏳", onPress: () => navigation.navigate("Attendance", { screen: "PendingAttendance" }) },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={`${getGreeting()}, ${firstName}`}
        subtitle={`${hostelName || "Hostel"}${blockName ? ` · ${blockName}` : ""}`}
        style={styles.header}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading ? (
          <LoadingScreen message="Loading dashboard..." />
        ) : error ? (
          <ErrorView message={getErrorMessage(error)} onRetry={reload} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              {stats.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} style={styles.statItem} />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((a) => (
                <Pressable
                  key={a.label}
                  style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
                  onPress={a.onPress}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionIcon}>{a.icon}</Text>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
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
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: SPACING.md, marginBottom: SPACING.lg },
  statItem: { width: "47%", flex: 0 },
  sectionTitle: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.md },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: SPACING.md },
  actionCard: { width: "47%", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, ...SHADOW },
  actionIcon: { fontSize: 26, marginBottom: SPACING.sm },
  actionLabel: { fontSize: FONT_SIZE.sm, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
});