import React from "react";
import { View, Text, StyleSheet } from "react-native";

const SIZES = {
  sm: { size: 36, fontSize: 14 },
  md: { size: 48, fontSize: 18 },
  lg: { size: 64, fontSize: 24 },
};

const COLORS = ["#2563eb", "#7c3aed", "#dc2626", "#16a34a", "#d97706", "#0891b2"];

export default function Avatar({ name = "U", size = "md", style }) {
  const { size: s, fontSize } = SIZES[size] || SIZES.md;
  const initial = (name || "U").charAt(0).toUpperCase();
  const colorIndex = name.charCodeAt(0) % COLORS.length;

  return (
    <View
      style={[
        styles.avatar,
        { width: s, height: s, borderRadius: s / 2, backgroundColor: COLORS[colorIndex] },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "800",
  },
});
