import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppCard, EmptyState, ErrorView, LoadingScreen, Badge, Fab } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFetch, useFocusReload } from "../../hooks/useFetch";

export default function WardenManagementScreen() {
  const navigation = useNavigation();
  const { data: wardens, loading, error, refresh, refreshing, reload } = useFetch(() => adminService.getWardens(), []);
  useFocusReload(reload);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Wardens" subtitle="Manage hostel wardens" style={styles.header} />

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={wardens}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <EmptyState emoji="🛡️" title="No wardens found" description="Tap + Add Warden to create a warden account." />
          }
          renderItem={({ item }) => {
            const hostel = item.hostelId || {};
            const block = item.blockId || {};
            return (
              <AppCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.wardenName}>{item.name}</Text>
                    <Text style={styles.wardenPhone}>{item.phone}</Text>
                  </View>
                  <Badge label={item.isActive ? "Active" : "Inactive"} type={item.isActive ? "success" : "info"} />
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>Hostel</Text>
                    <Text style={styles.metaValue}>{hostel.name || "—"}</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>Block</Text>
                    <Text style={styles.metaValue}>{block.name || "—"}</Text>
                  </View>
                </View>
              </AppCard>
            );
          }}
        />
      )}

      <Fab label="Add Warden" onPress={() => navigation.navigate("AddWarden")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { marginBottom: SPACING.sm },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: SPACING.md },
  wardenName: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.textPrimary },
  wardenPhone: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 1 },
  metaRow: { flexDirection: "row", gap: SPACING.md },
  metaBox: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: SPACING.sm },
  metaLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  metaValue: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textPrimary },
});