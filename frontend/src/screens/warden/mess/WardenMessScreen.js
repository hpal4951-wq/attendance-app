import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../../theme";
import { AppHeader, MenuCard, EmptyState, ErrorView, LoadingScreen } from "../../../components";
import menuService from "../../../services/menuService";
import { getErrorMessage } from "../../../utils/error";
import { useFetch } from "../../../hooks/useFetch";

export default function WardenMessScreen() {
  const navigation = useNavigation();
  const { data, loading, error, refresh, refreshing, reload } = useFetch(() => menuService.getMenu(), []);

  const menu = data?.menu || [];

  const links = [
    { label: "Poll Results", icon: "📊", onPress: () => navigation.navigate("WardenPollResults") },
    { label: "Suggestions", icon: "💡", onPress: () => navigation.navigate("WardenSuggestion") },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Mess" subtitle="Menu, polls and suggestions" style={styles.header} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Text style={styles.sectionTitle}>Today's Menu</Text>
        {loading ? <LoadingScreen message="Loading menu..." /> : error ? <ErrorView message={getErrorMessage(error)} onRetry={reload} /> : menu.some((m) => m.items.length) ? (
          menu.map((m) => <MenuCard key={m.mealType} mealType={m.mealType} items={m.items} />)
        ) : <EmptyState emoji="🍽️" title="No menu" description="Today's menu is not available." />}

        <Text style={styles.sectionTitle}>Mess Management</Text>
        <View style={styles.linksRow}>
          {links.map((l) => (
            <Pressable key={l.label} style={({ pressed }) => [styles.linkCard, pressed && { opacity: 0.85 }]} onPress={l.onPress}>
              <Text style={styles.linkIcon}>{l.icon}</Text>
              <Text style={styles.linkLabel}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginTop: 16, marginBottom: 12 },
  linksRow: { flexDirection: "row", gap: 12 },
  linkCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, ...SHADOW },
  linkIcon: { fontSize: 26, marginBottom: 8 },
  linkLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
});