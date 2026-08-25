import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppCard, AppSelect, EmptyState, ErrorView, LoadingScreen, AttendanceStatus } from "../../components";
import * as attendanceService from "../../services/attendanceService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";
import { DatePickerModal } from "../../components";

const SLOT_FILTERS = [
  { value: "", label: "All Slots" },
  { value: "morning", label: "Morning" },
  { value: "night", label: "Night" },
];

export default function AttendanceHistoryScreen() {
  const navigation = useNavigation();
  const [slot, setSlot] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [monthYear, setMonthYear] = useState(null); // "YYYY-MM" or null for all

  const { data: records, loading, error, refresh, refreshing, reload } = useFetch(
    () => {
      const params = {};
      if (slot) params.slot = slot;
      if (monthYear) {
        const [y, m] = monthYear.split("-");
        params.year = y;
        params.month = m;
      }
      return attendanceService.getAttendanceHistory(params);
    },
    [slot, monthYear]
  );

  const list = records?.data || (Array.isArray(records) ? records : []);

  const toDisplayStatus = (r) => {
    if (r.status === "present") return "present";
    if (r.status === "absent") return "outside_hostel";
    return "pending";
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Attendance History" subtitle="Your past attendance records" style={styles.header} />

      <View style={styles.filtersRow}>
        <Pressable style={styles.dateBtn} onPress={() => setPickerVisible(true)}>
          <Text style={styles.dateBtnText}>{monthYear || "All Time"}</Text>
        </Pressable>
        <AppSelect placeholder="Slot" value={slot} options={SLOT_FILTERS} onChange={setSlot} style={styles.slotSelect} />
      </View>

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <EmptyState emoji="🗓️" title="No attendance records" description="Your attendance history will appear here." />
          }
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.date}>{item.date}</Text>
                  <Text style={styles.slot}>{item.slot === "morning" ? "Morning" : "Night"}</Text>
                </View>
                <AttendanceStatus
                  status={toDisplayStatus(item)}
                  lastCheckedAt={item.markedAt}
                  reason={item.reason}
                  compact
                />
              </View>
              {item.distanceFromHostel != null ? (
                <Text style={styles.distance}>Distance: {item.distanceFromHostel} m</Text>
              ) : null}
            </AppCard>
          )}
        />
      )}

      <DatePickerModal
        visible={pickerVisible}
        value={monthYear ? `${monthYear}-01` : undefined}
        onClose={() => setPickerVisible(false)}
        onSelect={(dateStr) => {
          setMonthYear(dateStr.slice(0, 7));
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  filtersRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  dateBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  dateBtnText: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textPrimary },
  slotSelect: { flex: 1, marginBottom: 0 },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: { marginBottom: SPACING.sm },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.md, marginBottom: 6 },
  date: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.textPrimary },
  slot: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 1 },
  distance: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
});