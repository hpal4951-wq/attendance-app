import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, MenuCard, EmptyState, ErrorView, LoadingScreen } from "../../components";
import menuService from "../../services/menuService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";
import { getTodayDateString, shiftDate, formatDate } from "../../utils/date";

const PRESETS = ["Today", "Tomorrow", "This Week"];

export default function MessMenuScreen() {
  const navigation = useNavigation();
  const [preset, setPreset] = useState("Today");

  const today = getTodayDateString();
  const tomorrow = shiftDate(today, 1);

  const { data, loading, error, refresh, refreshing, reload } = useFetch(
    () => {
      if (preset === "This Week") return menuService.getWeeklyMenu();
      const date = preset === "Today" ? today : tomorrow;
      return menuService.getMenu(date);
    },
    [preset]
  );

  const meals = data?.menu || [];
  const week = data && Array.isArray(data) ? data : [];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Menu" subtitle="Daily menu" showBack onBack={() => navigation.goBack()} style={styles.header} />

      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <Pressable key={p} style={[styles.presetBtn, preset === p && styles.presetBtnActive]} onPress={() => setPreset(p)}>
            <Text style={[styles.presetText, preset === p && styles.presetTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <ErrorView message={getErrorMessage(error)} onRetry={reload} />
        ) : preset === "This Week" ? (
          week.map((day) => (
            <View key={day.date} style={styles.dayBlock}>
              <Text style={styles.dayLabel}>{formatDate(day.date)}</Text>
              {Object.keys(day.meals || {}).map((mealType) => (
                <MenuCard key={mealType} mealType={mealType} items={day.meals[mealType]} />
              ))}
            </View>
          ))
        ) : meals.some((m) => m.items.length) ? (
          meals.map((m) => <MenuCard key={m.mealType} mealType={m.mealType} items={m.items} />)
        ) : (
          <EmptyState emoji="🍽️" title="No menu available" description="Today's menu is not available." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  presetRow: { flexDirection: "row", gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  presetBtnActive: { backgroundColor: COLORS.primary },
  presetText: { fontSize: FONT_SIZE.sm, fontWeight: "700", color: COLORS.textSecondary },
  presetTextActive: { color: COLORS.white },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  dayBlock: { marginBottom: SPACING.lg },
  dayLabel: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.textPrimary, marginBottom: SPACING.sm },
});