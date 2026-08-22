import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppCard, AppButton, EmptyState, ErrorView, LoadingScreen, Badge, Fab } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFetch, useFocusReload } from "../../hooks/useFetch";

export default function BlockManagementScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { hostelId, hostelName } = route.params || {};
  const { data: blocks, loading, error, refresh, refreshing, reload } = useFetch(() => adminService.getBlocks(hostelId), [hostelId]);
  useFocusReload(reload);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={hostelName || "Blocks"} subtitle="Manage blocks" showBack onBack={() => navigation.goBack()} style={styles.header} />

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyState emoji="🏬" title="No blocks found" description="Tap + Add Block to create the first block." />}
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.blockName}>{item.name}</Text>
                <Badge label={item.status} type={item.status === "active" ? "info" : "info"} />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>Floors: {item.floors}</Text>
                <Text style={styles.meta}>Rooms: {item.roomCount ?? 0}</Text>
              </View>
              <AppButton
                title="Manage Rooms"
                variant="secondary"
                onPress={() => navigation.navigate("RoomList", { hostelId, blockId: item._id, blockName: item.name, hostelName })}
              />
            </AppCard>
          )}
        />
      )}

      <Fab label="Add Block" onPress={() => navigation.navigate("AddBlock", { hostelId, hostelName })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  blockName: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  metaRow: { flexDirection: "row", gap: 20, marginBottom: 12 },
  meta: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
});