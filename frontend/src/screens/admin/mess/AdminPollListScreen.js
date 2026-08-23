import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Alert, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../theme";
import { AppHeader, AppCard, AppButton, Badge, EmptyState, ErrorView, LoadingScreen } from "../../../components";
import pollService from "../../../services/pollService";
import { getErrorMessage } from "../../../utils/error";
import { useFetch, useFocusReload } from "../../../hooks/useFetch";
import { formatISODate } from "../../../utils/date";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "closed", label: "Closed" },
];

export default function AdminPollListScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState("");
  const { data: polls, loading, error, refresh, refreshing, reload } = useFetch(() => pollService.getAdminPolls({ status: tab || undefined }), [tab]);
  useFocusReload(reload);

  const handleClose = (poll) => {
    Alert.alert("Close Poll", `Close "${poll.question}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Close", style: "destructive", onPress: async () => { try { await pollService.closePoll(poll._id); reload(); } catch (e) { Alert.alert("Error", getErrorMessage(e)); } } },
    ]);
  };

  const handleDelete = (poll) => {
    Alert.alert("Delete Poll", `Delete "${poll.question}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await pollService.deletePoll(poll._id); reload(); } catch (e) { Alert.alert("Error", getErrorMessage(e)); } } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="All Polls" subtitle="Manage polls" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <View style={styles.tabRow}>
        {STATUS_TABS.map((t) => (
          <Pressable key={t.value} style={[styles.tab, tab === t.value && styles.tabActive]} onPress={() => setTab(t.value)}>
            <Text style={[styles.tabText, tab === t.value && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={polls}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyState emoji="🗳️" title="No polls" description="No polls found." />}
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <Text style={styles.question}>{item.question}</Text>
              <View style={styles.metaRow}>
                <Badge label={item.status} type={item.status === "active" ? "success" : item.status === "scheduled" ? "info" : "warning"} />
                <Text style={styles.meta}>Votes: {item.totalVotes}</Text>
                <Text style={styles.meta}>Ends: {formatISODate(item.endAt)}</Text>
              </View>
              <View style={styles.actions}>
                <AppButton title="Results" variant="ghost" onPress={() => navigation.navigate("AdminPollResults", { pollId: item._id })} />
                {item.status === "active" ? <AppButton title="Close" variant="danger" onPress={() => handleClose(item)} /> : null}
                <AppButton title="Delete" variant="ghost" onPress={() => handleDelete(item)} />
              </View>
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
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  list: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 12 },
  question: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
});