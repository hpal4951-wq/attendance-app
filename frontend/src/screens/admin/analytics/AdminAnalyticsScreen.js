import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../../theme";
import { AppHeader, StatCard, ErrorView, LoadingScreen } from "../../../components";
import analyticsService from "../../../services/analyticsService";
import { getErrorMessage } from "../../../utils/error";
import { useFetch } from "../../../hooks/useFetch";

export default function AdminAnalyticsScreen() {
  const navigation = useNavigation();
  const { data, loading, error, refresh, refreshing, reload } = useFetch(() => analyticsService.getAdminOverview(), []);

  const links = [
    { label: "Attendance Analytics", icon: "📊", screen: "AttendanceAnalytics" },
    { label: "Mess Analytics", icon: "🍽️", screen: "MessAnalytics" },
    { label: "Student Analytics", icon: "👨‍🎓", screen: "StudentAnalytics" },
    { label: "Low Attendance", icon: "⚠️", screen: "LowAttendance" },
    { label: "Audit Logs", icon: "📜", screen: "AuditLogs" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Analytics" subtitle="System overview" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {loading ? <LoadingScreen /> : error ? <ErrorView message={getErrorMessage(error)} onRetry={reload} /> : (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Students" value={data?.totalStudents ?? 0} icon="👨‍🎓" color={COLORS.primary} style={styles.stat} />
              <StatCard label="Hostels" value={data?.totalHostels ?? 0} icon="🏢" color={COLORS.info} style={styles.stat} />
              <StatCard label="Wardens" value={data?.totalWardens ?? 0} icon="🛡️" color={COLORS.secondary} style={styles.stat} />
              <StatCard label="Active Polls" value={data?.activePolls ?? 0} icon="🗳️" color={COLORS.warning} style={styles.stat} />
            </View>

            <Text style={styles.sectionTitle}>Today's Attendance</Text>
            <View style={styles.todayRow}>
              <View style={styles.todayBox}><Text style={[styles.todayValue, { color: COLORS.success }]}>{data?.todayAttendance?.present ?? 0}</Text><Text style={styles.todayLabel}>Present</Text></View>
              <View style={styles.todayBox}><Text style={[styles.todayValue, { color: COLORS.danger }]}>{data?.todayAttendance?.outside ?? 0}</Text><Text style={styles.todayLabel}>Outside</Text></View>
              <View style={styles.todayBox}><Text style={[styles.todayValue, { color: COLORS.warning }]}>{data?.todayAttendance?.pending ?? 0}</Text><Text style={styles.todayLabel}>Pending</Text></View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoText}>Low Attendance: <Text style={styles.infoBold}>{data?.lowAttendanceCount ?? 0}</Text></Text>
              <Text style={styles.infoText}>Pending Suggestions: <Text style={styles.infoBold}>{data?.pendingSuggestions ?? 0}</Text></Text>
            </View>

            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.linksGrid}>
              {links.map((l) => (
                <Pressable key={l.screen} style={({ pressed }) => [styles.linkCard, pressed && { opacity: 0.85 }]} onPress={() => navigation.navigate(l.screen)}>
                  <Text style={styles.linkIcon}>{l.icon}</Text>
                  <Text style={styles.linkLabel}>{l.label}</Text>
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
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  stat: { width: "47%", flex: 0 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  todayRow: { flexDirection: "row", gap: 12 },
  todayBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  todayValue: { fontSize: 28, fontWeight: "900" },
  todayLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  infoRow: { marginTop: 16, gap: 6 },
  infoText: { fontSize: 14, color: COLORS.textSecondary },
  infoBold: { fontWeight: "800", color: COLORS.textPrimary },
  linksGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  linkCard: { width: "47%", backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, ...SHADOW },
  linkIcon: { fontSize: 24, marginBottom: 8 },
  linkLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
});