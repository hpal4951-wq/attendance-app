import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, SPACING } from "../theme";
import Logo from "./Logo";

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <View style={styles.container}>
      <Logo size={80} />
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={styles.spinner}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
  },
  spinner: {
    marginTop: SPACING.xxl,
  },
  message: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontWeight: "500",
  },
});
