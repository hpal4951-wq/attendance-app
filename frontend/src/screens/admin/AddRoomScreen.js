import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS } from "../../theme";
import { AppHeader, AppInput, AppButton, AppSelect } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";

export default function AddRoomScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { hostelId, blockId } = route.params || {};

  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("available");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    { value: "available", label: "Available" },
    { value: "full", label: "Full" },
    { value: "maintenance", label: "Maintenance" },
  ];

  const validate = () => {
    const e = {};
    if (!roomNumber.trim()) e.roomNumber = "Room number is required";
    const cap = parseInt(capacity, 10);
    if (capacity === "" || isNaN(cap) || cap <= 0) e.capacity = "Capacity must be a positive number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await adminService.createRoom({
        hostelId,
        blockId,
        roomNumber: roomNumber.trim(),
        floor: floor === "" ? 0 : parseInt(floor, 10),
        capacity: parseInt(capacity, 10),
        status,
      });
      Alert.alert("Success", "Room created successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.flex}>
        <AppHeader title="Add Room" subtitle="Create a new room" showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <AppInput label="Room Number" placeholder="e.g. A-101" value={roomNumber} onChangeText={setRoomNumber} error={errors.roomNumber} />
          <AppInput label="Floor" placeholder="e.g. 1" keyboardType="number-pad" value={floor} onChangeText={setFloor} />
          <AppInput label="Capacity" placeholder="e.g. 4" keyboardType="number-pad" value={capacity} onChangeText={setCapacity} error={errors.capacity} />
          <AppSelect label="Status" placeholder="Select status" value={status} options={statusOptions} onChange={setStatus} />
          <AppButton title="CREATE ROOM" onPress={handleSubmit} loading={submitting} disabled={submitting} />
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