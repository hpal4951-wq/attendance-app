import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../theme";
import { AppHeader, AppCard, ErrorView, LoadingScreen } from "../../../components";
import analyticsService from "../../../services/analyticsService";
import { getErrorMessage } from "../../../utils/error";
import { useFetch } from "../../../hooks/useFetch";

export default function AttendanceAnalyticsScreen() {
  const navigation = useNavigation();
  const { data, loading, error, refresh, refreshing, reload } = useFetch(() => analyticsService.getAdminAttendance(), []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Attendance Analytics" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {loading ? <LoadingScreen /> : error ? <ErrorView message={getErrorMessage(error)} onRetry={reload} /> : (
          <>
            <Text style={styles.sectionTitle}>Today</Text>
            <View style={styles.todayRow}>
              <View style={styles.todayBox}><Text style={[styles.todayValue, { color: COLORS.success }]}>{data?.today?.present ?? 0}</Text><Text style={styles.todayLabel}>Present</Text></View>
              <View style={styles.todayBox}><Text style={[styles.todayValue, { color: COLORS.danger }]}>{data?.today?.absent ?? 0}</Text><Text style={styles.todayLabel}>Outside</Text></View>
              <View style={styles.todayBox}><Text style={[styles.todayValue, { color: COLORS.warning }]}>{data?.today?.pending ?? 0}</Text><Text style={styles.todayLabel}>Pending</Text></View>
            </View>

            <Text style={styles.sectionTitle}>Period Averages</Text>
            <AppCard style={styles.card}>
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Weekly</Text>
                <Text style={styles.periodValue}>{data?.weeklyPercent ?? 0}%</Text>
              </View>
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Monthly</Text>
                <Text style={styles.periodValue}>{data?.monthlyPercent ?? 0}%</Text>
              </View>
            </AppCard>

            <Text style={styles.sectionTitle}>Hostel-wise (Today)</Text>
            {(data?.hostelWise || []).map((h) => (
              <AppCard key={String(h.hostelId)} style={styles.card}>
                <View style={styles.hostelHeader}>
                  <Text style={styles.hostelName}>{h.hostelName}</Text>
                  <Text style={styles.hostelPercent}>{h.percent}%</Text>
                </View>
                <Text style={styles.hostelMeta}>Present {h.present} / {h.total} students</Text>
                <View style={styles.track}><View style={[styles.fill, { width: `${h.percent}%` }]} /></View>
              </AppCard>
            ))}
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
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginTop: 16, marginBottom: 12 },
  todayRow: { flexDirection: "row", gap: 12 },
  todayBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  todayValue: { fontSize: 28, fontWeight: "900" },
  todayLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  card: { marginBottom: 10 },
  periodRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  periodLabel: { fontSize: 14, color: COLORS.textSecondary },
  periodValue: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  hostelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hostelName: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  hostelPercent: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  hostelMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, marginBottom: 8 },
  track: { height: 8, borderRadius: 999, backgroundColor: COLORS.bg, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999, backgroundColor: COLORS.primary },
});