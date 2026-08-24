import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, Avatar, Badge, AppButton, AppCard } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import attendanceService from "../../services/attendanceService";

const displayName = (obj) => {
  if (!obj) return "Not Assigned";
  if (typeof obj === "object" && obj.name) return obj.name;
  return "Not Assigned";
};

export default function StudentProfileScreen() {
  const { user, logout } = useAuth();
  const { data } = useFetch(() => attendanceService.getTodayAttendance(), []);

  const student = data?.student || {};
  const hostel = student.hostel || {};
  const block = student.block || {};
  const room = student.room || {};

  const rows = [
    { label: "Name", value: user?.name || "—" },
    { label: "Phone", value: user?.phone || "—" },
    { label: "Role", value: "Student" },
    { label: "Student ID", value: student.studentCode || "—" },
    { label: "Hostel", value: displayName(hostel) },
    { label: "Block", value: displayName(block) },
    { label: "Room", value: room.roomNumber || "Not Assigned" },
  ];

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
        try { await logout(); } catch (e) { console.warn("logout error:", e); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Profile" subtitle="Your account details" style={styles.header} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Avatar name={user?.name} size="lg" />
          <Text style={styles.name}>{user?.name || "Student"}</Text>
          <Badge label="Student" type="student" />
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