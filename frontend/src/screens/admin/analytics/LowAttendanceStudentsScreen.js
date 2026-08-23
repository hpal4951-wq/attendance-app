import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../theme";
import { AppHeader, AppCard, EmptyState, ErrorView, LoadingScreen } from "../../../components";
import analyticsService from "../../../services/analyticsService";
import { getErrorMessage } from "../../../utils/error";
import { useFetch } from "../../../hooks/useFetch";

export default function LowAttendanceStudentsScreen() {
  const navigation = useNavigation();
  const { data, loading, error, refresh, refreshing, reload } = useFetch(() => analyticsService.getLowAttendance(), []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Low Attendance" subtitle={`Below ${data?.threshold ?? 75}%`} showBack onBack={() => navigation.goBack()} style={styles.header} />
      {loading ? <LoadingScreen /> : error ? <ErrorView message={getErrorMessage(error)} onRetry={reload} /> : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyState emoji="🎉" title="No low attendance" description="All students are above the attendance threshold." />}
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.name}>{item.name || "Unknown"}</Text>
                <Text style={[styles.percent, { color: COLORS.danger }]}>{item.attendancePercent}%</Text>
              </View>
              <Text style={styles.meta}>{item.hostel || "—"} · {item.block || "—"} · {item.room || "—"}</Text>
            </AppCard>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  list: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  percent: { fontSize: 16, fontWeight: "800" },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
});