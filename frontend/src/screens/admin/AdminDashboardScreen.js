import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import {
  AppHeader,
  StatCard,
  AppCard,
  EmptyState,
  ErrorView,
  LoadingScreen,
  NotificationBell,
} from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const { data, loading, error, refresh, refreshing, reload } = useFetch(
    () => adminService.getAdminDashboard(),
    []
  );

  const firstName = (user?.name || "Admin").split(" ")[0];

  const stats = [
    { label: "Total Students", value: data?.totalStudents ?? 0, icon: "👨‍🎓", color: COLORS.primary },
    { label: "Total Wardens", value: data?.totalWardens ?? 0, icon: "🛡️", color: COLORS.secondary },
    { label: "Total Hostels", value: data?.totalHostels ?? 0, icon: "🏢", color: COLORS.info },
    { label: "Total Blocks", value: data?.totalBlocks ?? 0, icon: "🏬", color: COLORS.warning },
    { label: "Total Rooms", value: data?.totalRooms ?? 0, icon: "🚪", color: COLORS.success },
  ];

  const quickActions = [
    { label: "Add Student", icon: "👨‍🎓", screen: "Students" },
    { label: "Add Warden", icon: "🛡️", screen: "Wardens" },
    { label: "Add Hostel", icon: "🏢", screen: "Hostel" },
    { label: "Manage Rooms", icon: "🚪", screen: "Hostel" },
    { label: "Analytics", icon: "📊", screen: "AdminAnalytics" },
    { label: "Audit Logs", icon: "📜", screen: "AuditLogs" },
  ];

  const handleQuickAction = (action) => {
    if (action.screen === "AdminAnalytics" || action.screen === "AuditLogs") {
      navigation.navigate(action.screen);
    } else if (action.label === "Add Student") {
      navigation.navigate("Students", { screen: "AddStudent" });
    } else if (action.label === "Add Warden") {
      navigation.navigate("Wardens", { screen: "AddWarden" });
    } else if (action.label === "Add Hostel") {
      navigation.navigate("Hostel", { screen: "AddHostel" });
    } else {
      navigation.navigate("Hostel", { screen: "HostelList" });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={`${getGreeting()}, ${firstName}`}
        subtitle="Manage your hostel efficiently"
        style={styles.header}
        rightAction={<NotificationBell navigation={navigation} />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {loading ? (
          <LoadingScreen message="Loading dashboard..." />
        ) : error ? (
          <ErrorView message={getErrorMessage(error)} onRetry={reload} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              {stats.map((s) => (
                <StatCard
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  icon={s.icon}
                  color={s.color}
                  style={styles.statItem}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.label}
                  style={({ pressed }) => [
                    styles.actionCard,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => handleQuickAction(action)}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {data?.recentActivities?.length ? (
              data.recentActivities.map((item) => (
                <AppCard key={String(item.id)} padding={14} style={styles.activityCard}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityDesc}>
                    {item.description}
                    {item.time ? `  ·  ${new Date(item.time).toLocaleDateString()}` : ""}
                  </Text>
                </AppCard>
              ))
            ) : (
              <EmptyState
                emoji="🗒️"
                title="No recent activity"
                description="New students and room changes will show up here."
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statItem: {
    width: "47%",
    flex: 0,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACING.md,
  },
  actionCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  actionIcon: {
    fontSize: 26,
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  activityCard: {
    marginBottom: SPACING.sm,
  },
  activityTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  activityDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
