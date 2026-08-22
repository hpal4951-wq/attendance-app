import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppCard, EmptyState, ErrorView, LoadingScreen, AttendanceStatus, DatePickerModal } from "../../components";
import wardenService from "../../services/wardenService";
import { getErrorMessage } from "../../utils/error";
import { getTodayDateString, shiftDate } from "../../utils/date";

const DATE_PRESETS = ["Today", "Yesterday", "Select Date"];

export default function AttendanceMonitorScreen() {
  const navigation = useNavigation();
  const [date, setDate] = useState(getTodayDateString());
  const [preset, setPreset] = useState("Today");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (d, mode = "initial") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await wardenService.getAttendanceMonitor({ date: d });
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const summary = data?.summary || { total: 0, present: 0, absent: 0, pending: 0 };
  const stats = [
    { label: "Total Students", value: summary.total, color: COLORS.primary },
    { label: "Present", value: summary.present, color: COLORS.success },
    { label: "Absent", value: summary.absent, color: COLORS.danger },
    { label: "Pending", value: summary.pending, color: COLORS.warning },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Attendance Monitor" subtitle={`Today's attendance overview · ${data?.date || date}`} style={styles.header} />

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

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={() => load(date, "initial")} />
      ) : (
        <FlatList
          data={data?.records || []}
          keyExtractor={(item, index) => String(item.id || `${item.studentId}-${index}`)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(date, "refresh")} />}
          ListHeaderComponent={
            <View style={styles.summaryGrid}>
              {stats.map((s) => (
                <View key={s.label} style={styles.summaryBox}>
                  <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          }
          ListEmptyComponent={
            <EmptyState emoji="📊" title="No attendance records" description="No attendance records found for this date." />
          }
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.studentRoom}>Room {item.roomNumber || "—"}</Text>
                </View>
                <AttendanceStatus status={item.status} lastCheckedAt={item.lastCheckedAt} reason={item.reason} compact />
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
  list: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: SPACING.md, marginBottom: SPACING.lg },
  summaryBox: { width: "47%", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  summaryValue: { fontSize: FONT_SIZE.xxxl, fontWeight: "900" },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },
  card: { marginBottom: SPACING.sm },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.md },
  studentName: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.textPrimary },
  studentRoom: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
});