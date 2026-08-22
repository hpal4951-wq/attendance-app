import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppCard, AppButton, EmptyState, ErrorView, LoadingScreen, Badge, Fab } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFetch, useFocusReload } from "../../hooks/useFetch";

const STATUS_COLOR = {
  available: "success",
  full: "warning",
  maintenance: "info",
};

export default function RoomManagementScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { hostelId, blockId, blockName, hostelName } = route.params || {};
  const { data: rooms, loading, error, refresh, refreshing, reload } = useFetch(
    () => adminService.getRooms({ blockId }),
    [blockId]
  );
  useFocusReload(reload);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={blockName || "Rooms"}
        subtitle={hostelName ? `${hostelName} · Manage rooms` : "Manage rooms"}
        showBack
        onBack={() => navigation.goBack()}
        style={styles.header}
      />

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <EmptyState emoji="🚪" title="No rooms found" description="Tap + Add Room to create the first room in this block." />
          }
          renderItem={({ item }) => {
            const available = item.available ?? item.capacity - item.occupied;
            return (
              <AppCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.roomNumber}>{item.roomNumber}</Text>
                  <Badge label={item.status} type={STATUS_COLOR[item.status] || "info"} />
                </View>
                <Text style={styles.floor}>Floor: {item.floor}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaValue}>{item.capacity}</Text>
                    <Text style={styles.metaLabel}>Capacity</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaValue}>{item.occupied}</Text>
                    <Text style={styles.metaLabel}>Occupied</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={[styles.metaValue, { color: COLORS.success }]}>{available}</Text>
                    <Text style={styles.metaLabel}>Available</Text>
                  </View>
                </View>
                <AppButton
                  title="Add Room"
                  variant="ghost"
                  onPress={() => navigation.navigate("AddRoom", { hostelId, blockId })}
                />
              </AppCard>
            );
          }}
        />
      )}

      <Fab label="Add Room" onPress={() => navigation.navigate("AddRoom", { hostelId, blockId })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { marginBottom: SPACING.md },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  roomNumber: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.textPrimary },
  floor: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  metaRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.lg },
  metaBox: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, alignItems: "center" },
  metaValue: { fontSize: FONT_SIZE.lg, fontWeight: "800", color: COLORS.textPrimary },
  metaLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
});