import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from "../../theme";
import { AppHeader, AppButton, Avatar, Badge, ErrorView, LoadingScreen, AppCard } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFetch, useFocusReload } from "../../hooks/useFetch";

export default function StudentDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { studentId } = route.params || {};

  const { data: student, loading, error, reload, refresh, refreshing } = useFetch(
    () => adminService.getStudentById(studentId),
    [studentId]
  );
  useFocusReload(reload);

  const handleDeactivate = () => {
    Alert.alert(
      "Deactivate Student",
      "This will mark the student account as inactive. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await adminService.setStudentStatus(studentId, "inactive");
              Alert.alert("Success", "Student deactivated successfully.");
              reload();
            } catch (err) {
              Alert.alert("Error", getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Student Details" showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ErrorView message={getErrorMessage(error)} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const user = student?.userId || {};
  const hostel = student?.hostelId || {};
  const block = student?.blockId || {};
  const room = student?.roomId || {};
  const statusColor = student?.status === "active" ? "success" : student?.status === "inactive" ? "warning" : "info";

  const rows = [
    { label: "Student ID", value: student?.studentCode },
    { label: "Phone", value: user.phone },
    { label: "Course", value: student?.course || "—" },
    { label: "Year", value: student?.year || "—" },
    { label: "Hostel", value: hostel.name || "—" },
    { label: "Block", value: block.name || "—" },
    { label: "Room", value: room.roomNumber || "—" },
    { label: "Account Status", value: student?.status || "—" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Student Details" showBack onBack={() => navigation.goBack()} style={styles.header} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.profileCard}>
          <Avatar name={user.name} size="lg" />
          <Text style={styles.name}>{user.name}</Text>
          <Badge label={student?.status || "—"} type={statusColor} />
        </View>

        <AppCard style={styles.infoCard}>
          {rows.map((r) => (
            <View key={r.label} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </AppCard>

        <AppButton
          title="Edit Student"
          variant="secondary"
          onPress={() => navigation.navigate("AddStudent", { student })}
        />
        <AppButton
          title="Change Room"
          variant="secondary"
          style={styles.mt}
          onPress={() => navigation.navigate("ChangeRoom", { studentId })}
        />
        {student?.status === "active" ? (
          <AppButton title="Deactivate Student" variant="danger" style={styles.mt} onPress={handleDeactivate} />
        ) : null}
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
  mt: { marginTop: SPACING.sm },
});