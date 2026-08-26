import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";

const STATUS_META = {
  present: {
    label: "Present",
    icon: "✓",
    color: COLORS.success,
    bg: COLORS.successLight,
    detail: "Attendance automatically confirmed",
  },
  absent: {
    label: "Absent",
    icon: "✕",
    color: COLORS.danger,
    bg: COLORS.dangerLight,
    detail: "Student not present for this slot",
  },
  pending: {
    label: "Pending",
    icon: "⏳",
    color: COLORS.warning,
    bg: COLORS.warningLight,
    detail: "Attendance is being processed",
  },
  processing: {
    label: "Processing",
    icon: "🔄",
    color: COLORS.info,
    bg: COLORS.infoLight,
    detail: "Attendance is being processed",
  },
  location_unavailable: {
    label: "Location unavailable",
    icon: "⚠",
    color: COLORS.warning,
    bg: COLORS.warningLight,
    detail: "Location could not be verified",
  },
  outside_hostel: {
    label: "Outside hostel area",
    icon: "⚠",
    color: COLORS.danger,
    bg: COLORS.dangerLight,
    detail: "Student is outside the allowed hostel area",
  },
  not_verified: {
    label: "Not Verified",
    icon: "•",
    color: COLORS.textMuted,
    bg: COLORS.bg,
    detail: "No attendance record for this date",
  },
};

function formatTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Reusable attendance status indicator.
 * Reused later by the Student and Admin modules.
 *
 * props: status, lastCheckedAt, reason
 */
export default function AttendanceStatus({
  status,
  lastCheckedAt,
  reason,
  compact = false,
}) {
  const meta =
    STATUS_META[status] || {
      label: status || "Unknown",
      icon: "•",
      color: COLORS.textMuted,
      bg: COLORS.bg,
      detail: "",
    };

  const detail = reason || meta.detail;
  const time = formatTime(lastCheckedAt);

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.icon, { color: meta.color }]}>{meta.icon}</Text>
        <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
      </View>
      {!compact && detail ? (
        <Text style={styles.detail}>{detail}</Text>
      ) : null}
      {!compact && time ? (
        <Text style={styles.time}>Last checked: {time}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-start",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  icon: {
    fontSize: 13,
    fontWeight: "800",
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  detail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  time: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
