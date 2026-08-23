import React from "react";
import { View, StyleSheet, SafeAreaView, FlatList, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme";
import { AppHeader, SuggestionCard, EmptyState, ErrorView, LoadingScreen } from "../../components";
import suggestionService from "../../services/suggestionService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

export default function MySuggestionsScreen() {
  const navigation = useNavigation();
  const { data: suggestions, loading, error, refresh, refreshing, reload } = useFetch(() => suggestionService.getMySuggestions(), []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="My Suggestions" subtitle="Track your submitted suggestions" showBack onBack={() => navigation.goBack()} style={styles.header} />
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyState emoji="💡" title="No suggestions" description="You haven't submitted any suggestions yet." />}
          renderItem={({ item }) => (
            <SuggestionCard
              title={item.title}
              type={item.type}
              description={item.description}
              status={item.status}
              createdAt={item.createdAt}
              adminResponse={item.adminResponse}
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