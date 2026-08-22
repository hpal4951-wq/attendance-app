import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, RADIUS, SHADOW } from "../theme";

export default function AppCard({ children, style, padding = 16 }) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    ...SHADOW,
  },
});
