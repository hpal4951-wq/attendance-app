import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../theme";
import { AppHeader, AppCard, StatCard, ErrorView, LoadingScreen } from "../../../components";
import analyticsService from "../../../services/analyticsService";
import { getErrorMessage } from "../../../utils/error";
import { useFetch } from "../../../hooks/useFetch";

export default function MessAnalyticsScreen() {
  const navigation = useNavigation();
  const { data, loading, error, refresh, refreshing, reload } = useFetch(() => analyticsService.getAdminMess(), []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Mess Analytics" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {loading ? <LoadingScreen /> : error ? <ErrorView message={getErrorMessage(error)} onRetry={reload} /> : (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Active Polls" value={data?.activePolls ?? 0} icon="🗳️" color={COLORS.primary} style={styles.stat} />
              <StatCard label="Total Votes" value={data?.totalVotes ?? 0} icon="🗳️" color={COLORS.info} style={styles.stat} />
            </View>

            <AppCard style={styles.card}>
              <Text style={styles.cardLabel}>Most Selected Food</Text>
              <Text style={styles.mostFood}>{data?.mostVoted?.text || "—"}</Text>
              {data?.mostVoted?.votes ? <Text style={styles.cardSub}>{data.mostVoted.votes} votes</Text> : null}
            </AppCard>

            <Text style={styles.sectionTitle}>Suggestions</Text>
            <AppCard style={styles.card}>
              <View style={styles.row}><Text style={styles.label}>Approved</Text><Text style={styles.value}>{data?.suggestionCounts?.approved ?? 0}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Implemented</Text><Text style={styles.value}>{data?.suggestionCounts?.implemented ?? 0}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Rejected</Text><Text style={styles.value}>{data?.suggestionCounts?.rejected ?? 0}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Pending</Text><Text style={styles.value}>{data?.suggestionCounts?.pending ?? 0}</Text></View>
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
  statsGrid: { flexDirection: "row", gap: 12 },
  stat: { width: "47%", flex: 0 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginTop: 16, marginBottom: 12 },
  card: { marginBottom: 10 },
  cardLabel: { fontSize: 12, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 },
  mostFood: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { fontSize: 14, color: COLORS.textSecondary },
  value: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
});