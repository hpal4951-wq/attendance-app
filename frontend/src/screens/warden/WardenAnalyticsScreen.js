import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, StatCard, AppCard, ErrorView, LoadingScreen } from "../../components";
import analyticsService from "../../services/analyticsService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

export default function WardenAnalyticsScreen() {
  const navigation = useNavigation();
  const { data, loading, error, refresh, refreshing, reload } = useFetch(() => analyticsService.getWardenAnalytics(), []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Analytics"
        subtitle={`${data?.hostel?.name || "Hostel"}${data?.block?.name ? ` · ${data.block.name}` : ""}`}
        showBack
        onBack={() => navigation.goBack()}
        style={styles.header}
      />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {loading ? <LoadingScreen /> : error ? <ErrorView message={getErrorMessage(error)} onRetry={reload} /> : (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Students" value={data?.totalStudents ?? 0} icon="👨‍🎓" color={COLORS.primary} style={styles.stat} />
              <StatCard label="Attendance" value={`${data?.attendancePercent ?? 0}%`} icon="📊" color={COLORS.success} style={styles.stat} />
            </View>
            <View style={styles.statsGrid}>
              <StatCard label="Present" value={data?.present ?? 0} icon="✓" color={COLORS.success} style={styles.stat} />
              <StatCard label="Outside" value={data?.outside ?? 0} icon="✕" color={COLORS.danger} style={styles.stat} />
            </View>
            <AppCard style={styles.card}>
              <View style={styles.row}><Text style={styles.label}>Pending</Text><Text style={styles.value}>{data?.pending ?? 0}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Low Attendance</Text><Text style={[styles.value, { color: COLORS.danger }]}>{data?.lowAttendanceCount ?? 0} students</Text></View>
              <View style={styles.row}><Text style={styles.label}>Warning Threshold</Text><Text style={styles.value}>{data?.attendanceWarningThreshold ?? 75}%</Text></View>
            </AppCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  stat: { width: "47%", flex: 0 },
  card: { marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  label: { fontSize: 14, color: COLORS.textSecondary },
  value: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
});