import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Alert, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../theme";
import { AppHeader, SuggestionCard, EmptyState, ErrorView, LoadingScreen, AppButton } from "../../../components";
import suggestionService from "../../../services/suggestionService";
import { getErrorMessage } from "../../../utils/error";
import { useFetch, useFocusReload } from "../../../hooks/useFetch";

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "implemented", label: "Implemented" },
];

export default function SuggestionManagementScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState("");
  const { data: suggestions, loading, error, refresh, refreshing, reload } = useFetch(
    () => suggestionService.getAllSuggestions({ status: filter || undefined }),
    [filter]
  );
  useFocusReload(reload);

  const handleStatus = async (id, status) => {
    try {
      await suggestionService.updateSuggestionStatus(id, { status });
      reload();
    } catch (e) {
      Alert.alert("Error", getErrorMessage(e));
    }
  };

  const renderActions = (item) => {
    if (item.status === "implemented") return null;
    return (
      <View style={styles.actions}>
        {item.status !== "approved" ? <AppButton title="Approve" variant="success" onPress={() => handleStatus(item._id, "approved")} /> : null}
        {item.status !== "rejected" ? <AppButton title="Reject" variant="danger" onPress={() => handleStatus(item._id, "rejected")} /> : null}
        {item.status !== "implemented" ? <AppButton title="Implemented" variant="secondary" onPress={() => handleStatus(item._id, "implemented")} /> : null}
      </View>
    );
  };

  const extra = (item) => {
    const student = item.studentId?.userId || {};
    const room = item.studentId?.roomId || {};
    return (
      <Text style={styles.studentInfo}>
        {student.name || "Unknown"} · {item.studentId?.studentCode || ""} · Room {room.roomNumber || "—"}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Food Suggestions" subtitle="Manage student suggestions" showBack onBack={() => navigation.goBack()} style={styles.header} />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.value} style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]} onPress={() => setFilter(f.value)}>
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyState emoji="💡" title="No suggestions" description="No food suggestions have been submitted." />}
          renderItem={({ item }) => (
            <SuggestionCard
              title={item.title}
              type={item.type}
              description={item.description}
              status={item.status}
              createdAt={item.createdAt}
              adminResponse={item.adminResponse}
              extra={extra(item)}
              actions={renderActions(item)}
            />
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
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  list: { padding: 16, paddingBottom: 40 },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  studentInfo: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});