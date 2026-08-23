import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppCard, MenuCard, PollCard, EmptyState, ErrorView, LoadingScreen, AppButton } from "../../components";
import menuService from "../../services/menuService";
import pollService from "../../services/pollService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

export default function StudentMessScreen() {
  const navigation = useNavigation();
  const menuRes = useFetch(() => menuService.getMenu(), []);
  const pollsRes = useFetch(() => pollService.getActivePolls(), []);

  const menu = menuRes.data?.menu || [];
  const polls = pollsRes.data || [];

  const quickLinks = [
    { label: "Full Menu", icon: "🍽️", onPress: () => navigation.navigate("MessMenu") },
    { label: "All Polls", icon: "🗳️", onPress: () => navigation.navigate("ActivePolls") },
    { label: "My Suggestions", icon: "💡", onPress: () => navigation.navigate("MySuggestions") },
    { label: "Poll History", icon: "📜", onPress: () => navigation.navigate("PollHistory") },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Mess" subtitle="Today's menu and active polls" style={styles.header} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={menuRes.refreshing} onRefresh={() => { menuRes.refresh(); pollsRes.refresh(); }} />}
      >
        <Text style={styles.sectionTitle}>Today's Menu</Text>
        {menuRes.loading ? (
          <LoadingScreen message="Loading menu..." />
        ) : menuRes.error ? (
          <ErrorView message={getErrorMessage(menuRes.error)} onRetry={menuRes.reload} />
        ) : menu.some((m) => m.items.length) ? (
          menu.map((m) => <MenuCard key={m.mealType} mealType={m.mealType} items={m.items} />)
        ) : (
          <EmptyState emoji="🍽️" title="No menu available" description="Today's menu is not available." />
        )}

        <View style={styles.linksRow}>
          {quickLinks.map((l) => (
            <Pressable key={l.label} style={({ pressed }) => [styles.linkCard, pressed && { opacity: 0.85 }]} onPress={l.onPress}>
              <Text style={styles.linkIcon}>{l.icon}</Text>
              <Text style={styles.linkLabel}>{l.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Active Polls</Text>
        {pollsRes.loading ? (
          <LoadingScreen message="Loading polls..." />
        ) : pollsRes.error ? (
          <ErrorView message={getErrorMessage(pollsRes.error)} onRetry={pollsRes.reload} />
        ) : polls.length ? (
          polls.slice(0, 2).map((p) => (
            <PollCard
              key={String(p._id)}
              question={p.question}
              type={p.type}
              endAt={p.endAt}
              optionCount={p.options?.length || 0}
              totalVotes={p.totalVotes}
              hasVoted={p.hasVoted}
              action={<AppButton title={p.hasVoted ? "View Poll" : "Vote Now"} variant="primary" onPress={() => navigation.navigate("PollDetails", { pollId: p._id })} />}
            />
          ))
        ) : (
          <EmptyState emoji="🗳️" title="No active polls" description="No active polls right now." />
        )}

        <AppButton title="Suggest Food" variant="secondary" style={styles.suggestBtn} onPress={() => navigation.navigate("FoodSuggestion")} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  sectionTitle: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.md },
  linksRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: SPACING.md },
  linkCard: { width: "47%", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, ...SHADOW },
  linkIcon: { fontSize: 24, marginBottom: 6 },
  linkLabel: { fontSize: FONT_SIZE.sm, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  suggestBtn: { marginTop: SPACING.lg },
});