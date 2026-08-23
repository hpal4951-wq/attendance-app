import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";
import AppCard from "./AppCard";
import Badge from "./Badge";

const TYPE_LABELS = {
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  rating: "Rating",
  yes_no: "Yes / No",
};

const STATUS_COLOR = {
  active: "success",
  scheduled: "info",
  closed: "warning",
};

function formatEnd(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PollCard({ question, type, endAt, optionCount, totalVotes, status, hasVoted, action }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.metaRow}>
        <Badge label={TYPE_LABELS[type] || type} type="info" />
        {status ? <Badge label={status} type={STATUS_COLOR[status] || "info"} /> : null}
        {hasVoted ? <Badge label="Voted" type="success" /> : null}
      </View>
      <View style={styles.infoRow}>
        {endAt ? <Text style={styles.info}>Ends: {formatEnd(endAt)}</Text> : null}
        <Text style={styles.info}>{optionCount} options</Text>
        {totalVotes != null ? <Text style={styles.info}>{totalVotes} votes</Text> : null}
      </View>
      {action}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.md },
  question: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.textPrimary, marginBottom: SPACING.sm },
  metaRow: { flexDirection: "row", gap: 6, marginBottom: SPACING.sm, flexWrap: "wrap" },
  infoRow: { flexDirection: "row", gap: SPACING.lg, marginBottom: SPACING.md, flexWrap: "wrap" },
  info: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
});