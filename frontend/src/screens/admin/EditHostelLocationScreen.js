import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppInput, AppButton, AppCard } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";

export default function EditHostelLocationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const hostel = route.params?.hostel || {};

  const [form, setForm] = useState({
    latitude: hostel.latitude != null ? String(hostel.latitude) : "",
    longitude: hostel.longitude != null ? String(hostel.longitude) : "",
    attendanceRadius: hostel.radiusMeters != null ? String(hostel.radiusMeters) : "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    const lat = parseFloat(form.latitude);
    if (form.latitude === "" || isNaN(lat) || lat < -90 || lat > 90) e.latitude = "Enter a valid latitude (-90 to 90)";
    const lng = parseFloat(form.longitude);
    if (form.longitude === "" || isNaN(lng) || lng < -180 || lng > 180) e.longitude = "Enter a valid longitude (-180 to 180)";
    const radius = parseFloat(form.attendanceRadius);
    if (form.attendanceRadius === "" || isNaN(radius) || radius <= 0) e.attendanceRadius = "Radius must be a positive number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await adminService.updateHostelLocation(hostel._id, {
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        attendanceRadius: parseFloat(form.attendanceRadius),
      });
      Alert.alert("Success", "Hostel GPS location updated successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.flex}>
        <AppHeader title="Edit Hostel Location" subtitle={hostel.name || "Configure GPS location"} showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <AppCard style={styles.infoCard}>
            <Text style={styles.infoText}>
              Students' automatic attendance verifies that their device location is inside the radius below.
            </Text>
          </AppCard>
          <AppInput label="Latitude" placeholder="e.g. 28.8386" keyboardType="numeric" value={form.latitude} onChangeText={set("latitude")} error={errors.latitude} />
          <AppInput label="Longitude" placeholder="e.g. 78.7731" keyboardType="numeric" value={form.longitude} onChangeText={set("longitude")} error={errors.longitude} />
          <AppInput label="Attendance Radius (meters)" placeholder="e.g. 150" keyboardType="number-pad" value={form.attendanceRadius} onChangeText={set("attendanceRadius")} error={errors.attendanceRadius} />
          <AppButton title="SAVE LOCATION" onPress={handleSubmit} loading={submitting} disabled={submitting} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  infoCard: { marginBottom: SPACING.lg, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  infoText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
});
