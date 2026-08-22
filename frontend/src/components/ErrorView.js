import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";
import AppButton from "./AppButton";

export default function ErrorView({
  message = "Something went wrong",
  onRetry,
  emoji = "⚠️",
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <AppButton
          title="Try Again"
          onPress={onRetry}
          variant="primary"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxxl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  button: {
    minWidth: 160,
  },
});
