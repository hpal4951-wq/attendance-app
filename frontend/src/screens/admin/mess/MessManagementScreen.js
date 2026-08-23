import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../../theme";
import { AppHeader } from "../../../components";

const MENU_ITEMS = [
  { label: "Manage Menu", icon: "🍽️", screen: "MenuManagement" },
  { label: "Create Poll", icon: "🗳️", screen: "CreatePoll" },
  { label: "All Polls", icon: "📊", screen: "AdminPollList" },
  { label: "Food Suggestions", icon: "💡", screen: "SuggestionManagement" },
];

export default function MessManagementScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Mess Management" subtitle="Manage menu, polls and suggestions" style={styles.header} />
      <ScrollView contentContainerStyle={styles.content}>
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.screen}
            style={({ pressed }) => [styles.menuCard, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16 },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  menuIcon: { fontSize: 28, marginRight: 16 },
  menuLabel: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, flex: 1 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
});