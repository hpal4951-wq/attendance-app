import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";
import AppCard from "./AppCard";
import Badge from "./Badge";

const TYPE_LABELS = {
  vegetable: "Vegetable",
  dish: "Dish",
  breakfast: "Breakfast Item",
  lunch: "Lunch Item",
  dinner: "Dinner Item",
  snack: "Snack",
  general: "General",
};

const STATUS_COLOR = {
  pending: "warning",
  under_review: "info",
  approved: "success",
  rejected: "danger",
  implemented: "success",
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function SuggestionCard({ title, type, description, status, createdAt, adminResponse, extra, actions }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{TYPE_LABELS[type] || type} · Submitted: {formatDate(createdAt)}</Text>
        </View>
        <Badge label={status || "pending"} type={STATUS_COLOR[status] || "warning"} />
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {extra}
      {adminResponse ? (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Admin Response</Text>
          <Text style={styles.responseText}>{adminResponse}</Text>
        </View>
      ) : null}
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.sm },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.sm, marginBottom: 4 },
  title: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.textPrimary },
  sub: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 1 },
  description: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.sm },
  responseBox: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  responseLabel: { fontSize: FONT_SIZE.xs, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  responseText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary },
  actions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
});