import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../theme";

export default function Fab({ onPress, label, icon = "+", accessibilityLabel }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || label || "Add"}
      accessibilityRole="button"
    >
      <Text style={styles.icon}>{icon}</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },
  label: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
});
