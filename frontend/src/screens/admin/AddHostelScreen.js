import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme";
import { AppHeader, AppInput, AppButton } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";

export default function AddHostelScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({ name: "", address: "", latitude: "", longitude: "", attendanceRadius: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Hostel name is required";
    if (!form.address.trim()) e.address = "Address is required";
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
      await adminService.createHostel({
        name: form.name.trim(),
        address: form.address.trim(),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        attendanceRadius: parseFloat(form.attendanceRadius),
      });
      Alert.alert("Success", "Hostel created successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.flex}>
        <AppHeader title="Add Hostel" subtitle="Create a new hostel" showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <AppInput label="Hostel Name" placeholder="e.g. Boys Hostel" value={form.name} onChangeText={set("name")} error={errors.name} />
          <AppInput label="Address" placeholder="e.g. Main Campus" value={form.address} onChangeText={set("address")} error={errors.address} />
          <AppInput label="Latitude" placeholder="e.g. 28.8386" keyboardType="numeric" value={form.latitude} onChangeText={set("latitude")} error={errors.latitude} />
          <AppInput label="Longitude" placeholder="e.g. 78.7731" keyboardType="numeric" value={form.longitude} onChangeText={set("longitude")} error={errors.longitude} />
          <AppInput label="Attendance Radius (meters)" placeholder="e.g. 150" keyboardType="number-pad" value={form.attendanceRadius} onChangeText={set("attendanceRadius")} error={errors.attendanceRadius} />
          <AppButton title="CREATE HOSTEL" onPress={handleSubmit} loading={submitting} disabled={submitting} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
});