import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppButton, AppCard, PollOption, LoadingScreen, ErrorView, Badge } from "../../components";
import pollService from "../../services/pollService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";
import { formatISODate } from "../../utils/date";

export default function PollDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { pollId } = route.params || {};

  const { data: poll, loading, error, reload } = useFetch(() => pollService.getPollById(pollId), [pollId]);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Pre-select the student's existing vote once loaded.
  useEffect(() => {
    if (poll?.selectedOptionIds?.length) {
      setSelected(poll.selectedOptionIds);
    }
  }, [poll?.selectedOptionIds]);

  const multiple = poll?.type === "multiple_choice";

  const toggle = (optionId) => {
    if (multiple) {
      setSelected((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
    } else {
      setSelected([optionId]);
    }
  };

  const handleVote = async () => {
    if (!selected.length) {
      Alert.alert("Error", "Please select at least one option.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await pollService.submitVote(pollId, selected);
      const changed = res?.data?.changed;
      Alert.alert("Success", changed ? "Your vote has been updated." : "Your vote has been recorded.");
      reload();
    } catch (err) {
      if (err.status === 409) {
        Alert.alert("Already Voted", "You have already voted in this poll.");
      } else {
        Alert.alert("Error", getErrorMessage(err));
      }
      reload();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Poll" showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const closed = poll.status !== "active";
  const hasVoted = poll.hasVoted;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Poll" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppCard style={styles.card}>
          <Text style={styles.question}>{poll.question}</Text>
          {poll.description ? <Text style={styles.description}>{poll.description}</Text> : null}
          <View style={styles.metaRow}>
            {poll.endAt ? <Text style={styles.meta}>Ends: {formatISODate(poll.endAt)}</Text> : null}
            <Badge label={poll.status} type={poll.status === "active" ? "success" : "warning"} />
            {hasVoted ? <Badge label="Voted" type="success" /> : null}
          </View>
        </AppCard>

        {closed ? (
          <View style={styles.closedBox}>
            <Text style={styles.closedTitle}>Poll Closed</Text>
            <Text style={styles.closedText}>This poll is no longer accepting votes.</Text>
            <AppButton title="View Results" variant="secondary" onPress={() => navigation.navigate("PollResults", { pollId })} />
          </View>
        ) : (
          <>
            {poll.options.map((o) => {
              const oid = String(o._id);
              const isSelected = selected.includes(oid);
              return (
                <PollOption
                  key={oid}
                  label={o.text}
                  selected={isSelected}
                  onPress={() => toggle(oid)}
                  multiple={multiple}
                />
              );
            })}
            {hasVoted ? (
              <>
                <Text style={styles.changeNote}>You can change your vote while the poll is active.</Text>
                <AppButton
                  title="UPDATE VOTE"
                  onPress={handleVote}
                  loading={submitting}
                  disabled={submitting}
                  style={styles.submitBtn}
                />
                <AppButton
                  title="View Results"
                  variant="secondary"
                  onPress={() => navigation.navigate("PollResults", { pollId })}
                  style={styles.submitBtn}
                />
              </>
            ) : (
              <AppButton
                title="SUBMIT VOTE"
                onPress={handleVote}
                loading={submitting}
                disabled={submitting}
                style={styles.submitBtn}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 16 },
  question: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, lineHeight: 26 },
  description: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" },
  meta: { fontSize: 12, color: COLORS.textMuted },
  closedBox: { alignItems: "center", padding: 24 },
  closedTitle: { fontSize: 18, fontWeight: "800", color: COLORS.warning, marginBottom: 6 },
  closedText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 16 },
  changeNote: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginTop: 8, marginBottom: 4 },
  submitBtn: { marginTop: 8 },
});