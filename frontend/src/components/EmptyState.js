import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";

export default function EmptyState({ emoji = "📭", title, description }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 32,
    alignItems: "center",
    marginTop: 4,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 300,
  },
});
