import React from "react";
import { View, StyleSheet, SafeAreaView, FlatList, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme";
import { AppHeader, PollCard, EmptyState, ErrorView, LoadingScreen, AppButton } from "../../components";
import pollService from "../../services/pollService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

export default function ActivePollsScreen() {
  const navigation = useNavigation();
  const { data: polls, loading, error, refresh, refreshing, reload } = useFetch(() => pollService.getActivePolls(), []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Active Polls" subtitle="Vote for your preference" showBack onBack={() => navigation.goBack()} style={styles.header} />
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={polls}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyState emoji="🗳️" title="No active polls" description="No active polls right now." />}
          renderItem={({ item }) => (
            <PollCard
              question={item.question}
              type={item.type}
              endAt={item.endAt}
              optionCount={item.options?.length || 0}
              totalVotes={item.totalVotes}
              hasVoted={item.hasVoted}
              action={<AppButton title={item.hasVoted ? "View Poll" : "Vote Now"} onPress={() => navigation.navigate("PollDetails", { pollId: item._id })} />}
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
  list: { padding: 16, paddingBottom: 40 },
});