import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../theme";
import { AppHeader, AppCard, AppButton, PollCard, VoteResultBar, EmptyState, ErrorView, LoadingScreen } from "../../../components";
import pollService from "../../../services/pollService";
import { getErrorMessage } from "../../../utils/error";
import { useFetch } from "../../../hooks/useFetch";

export default function WardenPollResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { pollId } = route.params || {};

  const listRes = useFetch(() => pollService.getWardenPolls(), []);
  const resultsRes = useFetch(() => (pollId ? pollService.getPollResults(pollId) : Promise.resolve(null)), [pollId]);

  if (pollId) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Poll Results" showBack onBack={() => navigation.goBack()} style={styles.header} />
        {resultsRes.loading ? <LoadingScreen /> : resultsRes.error ? <ErrorView message={getErrorMessage(resultsRes.error)} onRetry={resultsRes.reload} /> : resultsRes.data ? (
          <View style={styles.content}>
            <AppCard style={styles.card}>
              <Text style={styles.question}>{resultsRes.data.question}</Text>
              <Text style={styles.total}>Total votes: {resultsRes.data.totalVotes ?? 0}</Text>
              {resultsRes.data.options?.length ? resultsRes.data.options.map((o) => (
                <VoteResultBar key={String(o._id)} label={o.text} percentage={o.percentage} votes={o.votes} />
              )) : <EmptyState emoji="📊" title="No votes" description="No votes yet." />}
            </AppCard>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Poll Results" subtitle="Select a poll to view results" showBack onBack={() => navigation.goBack()} style={styles.header} />
      {listRes.loading ? <LoadingScreen /> : listRes.error ? <ErrorView message={getErrorMessage(listRes.error)} onRetry={listRes.reload} /> : (
        <FlatList
          data={listRes.data}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={listRes.refreshing} onRefresh={listRes.refresh} />}
          ListEmptyComponent={<EmptyState emoji="🗳️" title="No polls" description="No polls found." />}
          renderItem={({ item }) => (
            <PollCard
              question={item.question}
              type={item.type}
              endAt={item.endAt}
              optionCount={item.options?.length || 0}
              totalVotes={item.totalVotes}
              status={item.status}
              action={<AppButton title="View Results" variant="secondary" onPress={() => navigation.navigate("WardenPollResults", { pollId: item._id })} />}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  list: { padding: 16, paddingBottom: 40 },
  card: { padding: 20 },
  question: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, lineHeight: 26, marginBottom: 8 },
  total: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
});