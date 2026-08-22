import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppCard, AppButton, EmptyState, ErrorView, LoadingScreen, Badge, Fab } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFetch, useFocusReload } from "../../hooks/useFetch";

export default function HostelManagementScreen() {
  const navigation = useNavigation();
  const { data: hostels, loading, error, refresh, refreshing, reload } = useFetch(() => adminService.getHostels(), []);
  useFocusReload(reload);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Hostels" subtitle="Manage your hostels" style={styles.header} />

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={hostels}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <EmptyState emoji="🏢" title="No hostels found" description="Tap + Add Hostel to create your first hostel." />
          }
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.hostelName}>{item.name}</Text>
                <Badge label="Active" type="info" />
              </View>
              {item.address ? <Text style={styles.hostelAddress}>{item.address}</Text> : null}
              <View style={styles.metaRow}>
                <Text style={styles.meta}>Blocks: {item.blockCount ?? 0}</Text>
                <Text style={styles.meta}>Rooms: {item.roomCount ?? 0}</Text>
                <Text style={styles.meta}>Radius: {item.radiusMeters}m</Text>
              </View>
              <AppButton
                title="View Blocks"
                variant="secondary"
                onPress={() => navigation.navigate("BlockList", { hostelId: item._id, hostelName: item.name })}
              />
            </AppCard>
          )}
        />
      )}

      <Fab label="Add Hostel" onPress={() => navigation.navigate("AddHostel")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { marginBottom: SPACING.md },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  hostelName: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.textPrimary },
  hostelAddress: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  metaRow: { flexDirection: "row", gap: SPACING.lg, marginBottom: SPACING.md },
  meta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: "500" },
});