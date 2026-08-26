import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Pressable, TextInput } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppCard, EmptyState, ErrorView, LoadingScreen, AttendanceStatus, DatePickerModal } from "../../components";
import wardenService from "../../services/wardenService";
import { getErrorMessage } from "../../utils/error";
import { getTodayDateString, shiftDate } from "../../utils/date";

const DATE_PRESETS = ["Today", "Yesterday", "Select Date"];
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Outside" },
  { value: "pending", label: "Pending" },
  { value: "not_verified", label: "Not Verified" },
];

export default function AttendanceMonitorScreen() {
  const [date, setDate] = useState(getTodayDateString());
  const [preset, setPreset] = useState("Today");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (d, mode = "initial") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const params = { date: d };
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await wardenService.getHostelAttendance(params);
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(date, "initial"); }, [date, load]);

  const handlePreset = (p) => {
    setPreset(p);
    if (p === "Today") setDate(getTodayDateString());
    else if (p === "Yesterday") setDate(shiftDate(getTodayDateString(), -1));
    else setPickerVisible(true);
  };

  const handleSelectDate = (d) => {
    setPreset("Custom");
    setDate(d);
  };

  const submitSearch = () => {
    setSearch(searchInput.trim());
  };

  const summary = data?.summary || { totalStudents: 0, present: 0, outside: 0, pending: 0, notVerified: 0 };
  const stats = [
    { label: "Total Students", value: summary.totalStudents ?? data?.totalStudents ?? 0, color: COLORS.primary },
    { label: "Present", value: summary.present ?? 0, color: COLORS.success },
    { label: "Outside", value: summary.outside ?? 0, color: COLORS.danger },
    { label: "Not Verified", value: summary.notVerified ?? 0, color: COLORS.textMuted },
  ];

  const records = data?.records || [];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Attendance Monitor" subtitle={`Hostel attendance · ${data?.date || date}`} style={styles.header} />

      <View style={styles.presetRow}>
        {DATE_PRESETS.map((p) => {
          const active = preset === p || (p === "Select Date" && preset === "Custom");
          return (
            <Pressable
              key={p}
              style={[styles.presetBtn, active && styles.presetBtnActive]}
              onPress={() => handlePreset(p)}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>{p}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, code, room..."
          placeholderTextColor={COLORS.textMuted}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchBtn} onPress={submitSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
        {search ? (
          <Pressable style={styles.clearBtn} onPress={() => { setSearch(""); setSearchInput(""); }}>
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <Pressable
              key={f.value}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
              onPress={() => setStatusFilter(f.value)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={() => load(date, "initial")} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.studentId || item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(date, "refresh")} />}
          ListHeaderComponent={
            <View>
              <View style={styles.summaryGrid}>
                {stats.map((s) => (
                  <View key={s.label} style={styles.summaryBox}>
                    <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.summaryLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              {data?.presentPercentage != null && data.totalStudents > 0 ? (
                <Text style={styles.percentNote}>Present rate: {data.presentPercentage}% of {data.totalStudents} students</Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState emoji="📊" title="No students found" description="No attendance records found for this filter and date." />
          }
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentMeta}>
                    {item.studentCode ? `${item.studentCode} · ` : ""}Room {item.room || "—"}
                  </Text>
                  {item.distance != null ? (
                    <Text style={styles.distance}>Distance: {item.distance} m</Text>
                  ) : null}
                  {item.verificationMethod ? (
                    <Text style={styles.method}>{item.verificationMethod === "manual" ? "Manual review" : "GPS verification"}</Text>
                  ) : null}
                </View>
                <AttendanceStatus status={item.status} lastCheckedAt={item.verifiedAt} reason={item.reason} compact />
              </View>
            </AppCard>
          )}
        />
      )}

      <DatePickerModal
        visible={pickerVisible}
        value={date}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  presetRow: { flexDirection: "row", gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  presetBtnActive: { backgroundColor: COLORS.primary },
  presetText: { fontSize: FONT_SIZE.sm, fontWeight: "700", color: COLORS.textSecondary },
  presetTextActive: { color: COLORS.white },
  searchRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  searchInput: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 8, fontSize: FONT_SIZE.sm, color: COLORS.textPrimary },
  searchBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 9 },
  searchBtnText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZE.sm },
  clearBtn: { backgroundColor: COLORS.border, borderRadius: RADIUS.full, width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  clearBtnText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "800" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: SPACING.md, marginBottom: SPACING.sm },
  summaryBox: { width: "47%", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  summaryValue: { fontSize: FONT_SIZE.xxxl, fontWeight: "900" },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },
  percentNote: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  card: { marginBottom: SPACING.sm },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.md },
  studentName: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.textPrimary },
  studentMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  distance: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  method: { fontSize: FONT_SIZE.xs, color: COLORS.primary, marginTop: 2, fontWeight: "600" },
});
