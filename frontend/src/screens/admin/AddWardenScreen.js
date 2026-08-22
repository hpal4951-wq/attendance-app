import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme";
import { AppHeader, AppInput, AppButton, AppSelect } from "../../components";
import adminService from "../../services/adminService";
import { getErrorMessage } from "../../utils/error";
import { useFetch } from "../../hooks/useFetch";

export default function AddWardenScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const hostelsRes = useFetch(() => adminService.getHostels(), []);
  const blocksRes = useFetch(() => (hostelId ? adminService.getBlocks(hostelId) : Promise.resolve([])), [hostelId]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.replace(/\s|-/g, ""))) e.phone = "Enter a valid 10-digit phone number";
    if (!password || password.length < 6) e.password = "Password must be at least 6 characters";
    if (!hostelId) e.hostelId = "Hostel is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // role is always "warden" — admin role can never be selected here
      await adminService.createWarden({
        name: name.trim(),
        phone: phone.trim(),
        password,
        role: "warden",
        hostelId,
        blockId: blockId || undefined,
      });
      Alert.alert("Success", "Warden created successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.flex}>
        <AppHeader title="Add Warden" subtitle="Create a warden account" showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <AppInput label="Full Name" placeholder="e.g. Hostel Warden" value={name} onChangeText={setName} error={errors.name} />
          <AppInput label="Phone" placeholder="e.g. 9876543210" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} error={errors.phone} />
          <AppInput label="Password" placeholder="Create a password" secureTextEntry value={password} onChangeText={setPassword} error={errors.password} />
          <AppSelect
            label="Hostel"
            placeholder="Select Hostel"
            value={hostelId}
            options={hostelsRes.data?.map((h) => ({ value: h._id, label: h.name })) || []}
            onChange={(v) => { setHostelId(v); setBlockId(""); }}
            error={errors.hostelId}
          />
          <AppSelect
            label="Block"
            placeholder={hostelId ? "Select Block" : "Select Hostel first"}
            value={blockId}
            options={blocksRes.data?.map((b) => ({ value: b._id, label: b.name })) || []}
            onChange={setBlockId}
            disabled={!hostelId}
          />
          <AppButton title="CREATE WARDEN" onPress={handleSubmit} loading={submitting} disabled={submitting} />
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