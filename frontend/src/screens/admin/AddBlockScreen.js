import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONT_SIZE, SPACING } from "../../theme";
import { AppHeader, AppInput, AppButton } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";

export default function AddBlockScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { hostelId, hostelName } = route.params || {};
  const [name, setName] = useState("");
  const [floors, setFloors] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Block name is required";
    const f = parseInt(floors, 10);
    if (floors === "" || isNaN(f) || f < 1) e.floors = "Floors must be at least 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await adminService.createBlock({ hostelId, name: name.trim(), floors: parseInt(floors, 10) });
      Alert.alert("Success", "Block created successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.flex}>
        <AppHeader title="Add Block" subtitle={`Hostel: ${hostelName || ""}`} showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <AppInput label="Block Name" placeholder="e.g. Block A" value={name} onChangeText={setName} error={errors.name} />
          <AppInput label="Number of Floors" placeholder="e.g. 4" keyboardType="number-pad" value={floors} onChangeText={setFloors} error={errors.floors} />
          <AppButton title="CREATE BLOCK" onPress={handleSubmit} loading={submitting} disabled={submitting} />
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