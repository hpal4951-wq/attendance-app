import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppCard, AppButton, AppInput, EmptyState, ErrorView, LoadingScreen, AttendanceStatus } from "../../components";
import wardenService from "../../services/wardenService";
import attendanceService from "../../services/attendanceService";
import { getErrorMessage } from "../../utils/error";
import { useFetch, useFocusReload } from "../../hooks/useFetch";

export default function PendingAttendanceScreen() {
  const navigation = useNavigation();
  const { data: records, loading, error, refresh, refreshing, reload } = useFetch(
    () => wardenService.getPendingAttendance(),
    []
  );
  useFocusReload(reload);

  const [reviewingId, setReviewingId] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async (id, status) => {
    if (!reason.trim()) {
      setReason("Manual correction by warden");
    }
    setSubmitting(true);
    try {
      await attendanceService.reviewAttendance(id, {
        status,
        reason: reason.trim() || "Manual correction by warden",
      });
      setReviewingId(null);
      setReason("");
      reload();
    } catch (err) {
      // Keep the form open on failure so the warden can retry.
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Pending Attendance" subtitle="Students awaiting verification" showBack onBack={() => navigation.goBack()} style={styles.header} />

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id || item.studentId)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <EmptyState emoji="✅" title="No pending attendance" description="All attendance records are processed. New pending records will appear here." />
          }
          renderItem={({ item }) => {
            const isOpen = reviewingId === String(item.id);
            return (
              <AppCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{item.studentName}</Text>
                    <Text style={styles.studentRoom}>Room {item.roomNumber || "—"}</Text>
                  </View>
                  <AttendanceStatus status="pending" lastCheckedAt={item.lastCheckedAt} reason={item.reason} compact />
                </View>
                {item.reason ? <Text style={styles.reason}>Reason: {item.reason}</Text> : null}
                {item.lastCheckedAt ? (
                  <Text style={styles.time}>
                    Last check: {new Date(item.lastCheckedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                ) : null}

                {isOpen ? (
                  <View style={styles.reviewBox}>
                    <Text style={styles.reviewTitle}>Manual Correction</Text>
                    <AppInput
                      placeholder="Reason (e.g. GPS unavailable near hostel entrance)"
                      value={reason}
                      onChangeText={setReason}
                      multiline
                      style={styles.reasonInput}
                    />
                    <View style={styles.reviewActions}>
                      <AppButton
                        title="Mark Present"
                        variant="success"
                        style={styles.flexBtn}
                        disabled={submitting}
                        loading={submitting}
                        onPress={() => handleReview(item.id, "present")}
                      />
                      <AppButton
                        title="Mark Absent"
                        variant="danger"
                        style={styles.flexBtn}
                        disabled={submitting}
                        loading={submitting}
                        onPress={() => handleReview(item.id, "absent")}
                      />
                    </View>
                    <AppButton title="Cancel" variant="ghost" disabled={submitting} onPress={() => { setReviewingId(null); setReason(""); }} />
                  </View>
                ) : (
                  <AppButton
                    title="Review"
                    variant="secondary"
                    onPress={() => { setReviewingId(String(item.id)); setReason(""); }}
                  />
                )}
              </AppCard>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: { marginBottom: SPACING.sm },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.md, marginBottom: SPACING.sm },
  studentName: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.textPrimary },
  studentRoom: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  reason: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 6 },
  time: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  reviewBox: { marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  reviewTitle: { fontSize: FONT_SIZE.md, fontWeight: "800", color: COLORS.textPrimary, marginBottom: SPACING.sm },
  reasonInput: { marginBottom: SPACING.md },
  reviewActions: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm },
  flexBtn: { flex: 1 },
});
