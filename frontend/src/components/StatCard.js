import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../theme";

export default function StatCard({ label, value, icon, color = COLORS.primary }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOW,
    minWidth: 100,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "500",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
