import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, Avatar, Badge, AppButton, AppCard } from "../../components";
import { useAuth } from "../../context/AuthContext";

export default function WardenProfileScreen() {
  const { user, logout } = useAuth();

  const hostel = user?.hostelId || {};
  const block = user?.blockId || {};

  const rows = [
    { label: "Name", value: user?.name || "—" },
    { label: "Phone", value: user?.phone || "—" },
    { label: "Role", value: "Warden" },
    { label: "Hostel", value: hostel?.name || "—" },
    { label: "Block", value: block?.name || "—" },
  ];

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Profile" subtitle="Your account details" style={styles.header} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Avatar name={user?.name} size="lg" />
          <Text style={styles.name}>{user?.name || "Warden"}</Text>
          <Badge label="Warden" type="warden" />
        </View>

        <AppCard style={styles.infoCard}>
          {rows.map((r) => (
            <View key={r.label} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </AppCard>

        <AppButton title="Logout" variant="danger" onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  profileCard: { alignItems: "center", marginBottom: SPACING.lg },
  name: { fontSize: FONT_SIZE.xxl, fontWeight: "800", color: COLORS.textPrimary, marginTop: SPACING.sm, marginBottom: 6 },
  infoCard: { marginBottom: SPACING.lg, padding: SPACING.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  rowValue: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.textPrimary, flex: 1, textAlign: "right", marginLeft: SPACING.md },
});