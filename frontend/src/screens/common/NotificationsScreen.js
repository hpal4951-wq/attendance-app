import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Alert, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppCard, AppButton, EmptyState, ErrorView, LoadingScreen, Badge } from "../../components";
import notificationService from "../../services/notificationService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";
import { formatISODate } from "../../utils/date";

const TYPE_LABELS = { attendance: "Attendance", mess: "Mess", poll: "Poll", system: "System", security: "Security" };

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { data, loading, error, refresh, refreshing, reload } = useFetch(
    () => notificationService.getNotifications(),
    []
  );

  const notifications = data?.notifications || [];

  const handlePress = async (item) => {
    if (!item.read) {
      try { await notificationService.markRead(item._id); reload(); } catch (e) {}
    }
    const d = item.data || {};
    const role = data?.role; // not — we don't have role here. Use navigation context.
    // Navigate based on type
    if (item.type === "poll" && d.pollId) {
      navigation.navigate("Mess", { screen: "PollDetails", params: { pollId: d.pollId } });
    } else if (item.type === "attendance") {
      navigation.navigate("Attendance", { screen: "Attendance" });
    } else if (item.type === "mess") {
      navigation.navigate("Mess", { screen: "MessMenu" });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Notifications"
        subtitle="Stay updated"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          notifications.length > 0 ? (
            <Pressable
              style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.7 }]}
              onPress={async () => { try { await notificationService.markAllRead(); reload(); } catch (e) { Alert.alert("Error", getErrorMessage(e)); } }}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
        style={styles.header}
      />
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyState emoji="🔔" title="No notifications" description="You have no notifications." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => handlePress(item)}>
              <AppCard style={[styles.card, !item.read && styles.cardUnread]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                  </View>
                  <View style={styles.metaRight}>
                    <Badge label={TYPE_LABELS[item.type] || item.type} type="info" />
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                  </View>
                </View>
                <Text style={styles.time}>{formatISODate(item.createdAt)}</Text>
              </AppCard>
            </Pressable>
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
  card: { marginBottom: 8 },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 2 },
  message: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  metaRight: { alignItems: "flex-end", gap: 6 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  time: { fontSize: 11, color: COLORS.textMuted },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.primaryLight },
  markAllText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
});