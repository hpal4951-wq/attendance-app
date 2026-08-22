import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components";

export default function WardenNavigator() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo size={40} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{user?.name || "Warden"}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>WARDEN</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          onPress={logout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.emoji}>🛡️</Text>
        <Text style={styles.title}>Warden Dashboard</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          Attendance review, student management, and hostel operations features will be available here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  headerInfo: {
    gap: 2,
  },
  headerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
  },
  logoutText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.danger,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
});
