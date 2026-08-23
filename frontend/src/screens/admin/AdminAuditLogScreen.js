import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppCard, EmptyState, ErrorView, LoadingScreen, Badge } from "../../components";
import auditService from "../../services/auditService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";
import { formatISODate } from "../../utils/date";

const ACTIONS = ["", "LOGIN_SUCCESS", "HOSTEL_CREATED", "BLOCK_CREATED", "STUDENT_CREATED", "WARDEN_CREATED", "POLL_CREATED", "POLL_CLOSED", "POLL_DELETED", "MENU_UPDATED", "SUGGESTION_STATUS_CHANGED", "ATTENDANCE_VERIFIED"];

export default function AdminAuditLogScreen() {
  const navigation = useNavigation();
  const [action, setAction] = useState("");
  const { data, loading, error, refresh, refreshing, reload } = useFetch(
    () => auditService.getAuditLogs({ action: action || undefined }),
    [action]
  );

  const logs = data?.logs || [];

  const filterChips = ACTIONS.filter((a) => a === "" || a === action);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Audit Logs" subtitle="System activity" showBack onBack={() => navigation.goBack()} style={styles.header} />

      <View style={styles.filterRow}>
        <Pressable style={[styles.chip, action === "" && styles.chipActive]} onPress={() => setAction("")}>
          <Text style={[styles.chipText, action === "" && styles.chipTextActive]}>All</Text>
        </Pressable>
        {ACTIONS.filter((a) => a).slice(0, 6).map((a) => (
          <Pressable key={a} style={[styles.chip, action === a && styles.chipActive]} onPress={() => setAction(action === a ? "" : a)}>
            <Text style={[styles.chipText, action === a && styles.chipTextActive]}>{a.replace(/_/g, " ").toLowerCase()}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? <LoadingScreen /> : error ? <ErrorView message={getErrorMessage(error)} onRetry={reload} /> : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyState emoji="📜" title="No audit logs" description="No activity recorded yet." />}
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.user}>{item.user?.name || "System"}</Text>
                <Badge label={item.action.replace(/_/g, " ")} type="info" />
              </View>
              <Text style={styles.meta}>
                {item.entity || "—"} · {formatISODate(item.createdAt)}
              </Text>
              <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
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
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 16, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  list: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  user: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});