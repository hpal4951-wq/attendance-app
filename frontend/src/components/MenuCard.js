import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";
import AppCard from "./AppCard";

const MEAL_LABELS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

export default function MenuCard({ mealType, items = [], date }) {
  const label = MEAL_LABELS[mealType] || mealType;
  return (
    <AppCard style={styles.card}>
      <Text style={styles.mealLabel}>{label}</Text>
      {items.length ? (
        items.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.itemRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.item}>{item}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No items available</Text>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.md },
  mealLabel: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.primary, marginBottom: SPACING.sm },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  bullet: { fontSize: FONT_SIZE.md, color: COLORS.primary, marginRight: 8, fontWeight: "700" },
  item: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  empty: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
});