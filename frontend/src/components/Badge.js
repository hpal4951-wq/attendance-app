import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FONT_SIZE, RADIUS } from "../theme";

const COLORS = {
  present: { bg: "#dcfce7", text: "#16a34a" },
  absent: { bg: "#fee2e2", text: "#dc2626" },
  pending: { bg: "#fef3c7", text: "#d97706" },
  admin: { bg: "#ede9fe", text: "#7c3aed" },
  warden: { bg: "#dbeafe", text: "#2563eb" },
  student: { bg: "#f0fdf4", text: "#16a34a" },
  info: { bg: "#e0f2fe", text: "#0284c7" },
};

export default function Badge({ label, type = "info", style }) {
  const colors = COLORS[type] || COLORS.info;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
