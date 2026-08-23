import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../theme";
import { AppHeader, AppCard, StatCard, ErrorView, LoadingScreen } from "../../../components";
import analyticsService from "../../../services/analyticsService";
import { getErrorMessage } from "../../../utils/error";
import { useFetch } from "../../../hooks/useFetch";

export default function StudentAnalyticsScreen() {
  const navigation = useNavigation();
  const { data, loading, error, refresh, refreshing, reload } = useFetch(() => analyticsService.getAdminOverview(), []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Student Analytics" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {loading ? <LoadingScreen /> : error ? <ErrorView message={getErrorMessage(error)} onRetry={reload} /> : (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Total Students" value={data?.totalStudents ?? 0} icon="👨‍🎓" color={COLORS.primary} style={styles.stat} />
              <StatCard label="Active Hostels" value={data?.totalHostels ?? 0} icon="🏢" color={COLORS.info} style={styles.stat} />
            </View>
            <AppCard style={styles.card}>
              <View style={styles.row}><Text style={styles.label}>Warning Threshold</Text><Text style={styles.value}>{data?.attendanceWarningThreshold ?? 75}%</Text></View>
              <View style={styles.row}><Text style={styles.label}>Low Attendance</Text><Text style={[styles.value, { color: COLORS.danger }]}>{data?.lowAttendanceCount ?? 0} students</Text></View>
            </AppCard>
            <Pressable style={styles.linkBtn} onPress={() => navigation.navigate("LowAttendance")}>
              <Text style={styles.linkText}>View Low Attendance Students →</Text>
            </Pressable>
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
  statsGrid: { flexDirection: "row", gap: 12 },
  stat: { width: "47%", flex: 0 },
  card: { marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  label: { fontSize: 14, color: COLORS.textSecondary },
  value: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  linkBtn: { paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: "center" },
  linkText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
});