import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";

export default function VoteResultBar({ label, percentage = 0, votes = 0 }) {
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <Text style={styles.percentage}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.votes}>{votes} vote{votes === 1 ? "" : "s"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  percentage: {
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
    color: COLORS.primary,
  },
  track: {
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  votes: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});