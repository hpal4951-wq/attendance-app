import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppCard, VoteResultBar, EmptyState, ErrorView, LoadingScreen } from "../../components";
import pollService from "../../services/pollService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

export default function PollResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { pollId } = route.params || {};

  const { data: results, loading, error, refresh, refreshing, reload } = useFetch(
    () => pollService.getPollResults(pollId),
    [pollId]
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Poll Results" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <ErrorView message={getErrorMessage(error)} onRetry={reload} />
        ) : (
          <AppCard style={styles.card}>
            <Text style={styles.question}>{results?.question}</Text>
            <Text style={styles.total}>Total votes: {results?.totalVotes ?? 0}</Text>
            {results?.options?.length ? (
              results.options.map((o) => (
                <VoteResultBar key={String(o._id)} label={o.text} percentage={o.percentage} votes={o.votes} />
              ))
            ) : (
              <EmptyState emoji="📊" title="No votes yet" description="No votes have been recorded." />
            )}
          </AppCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  card: { padding: 20 },
  question: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, lineHeight: 26, marginBottom: 8 },
  total: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
});