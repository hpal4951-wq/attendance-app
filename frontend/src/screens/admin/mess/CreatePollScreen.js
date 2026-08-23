import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../theme";
import { AppHeader, AppInput, AppButton, AppSelect, DatePickerModal } from "../../../components";
import pollService from "../../../services/pollService";
import { getErrorMessage } from "../../../utils/error";

const POLL_TYPES = [
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "yes_no", label: "Yes / No" },
  { value: "rating", label: "Rating" },
];

export default function CreatePollScreen() {
  const navigation = useNavigation();
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("single_choice");
  const [options, setOptions] = useState(["", ""]);
  const [startPicker, setStartPicker] = useState(false);
  const [endPicker, setEndPicker] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const setOption = (i, v) => { const copy = [...options]; copy[i] = v; setOptions(copy); };

  const validate = () => {
    const e = {};
    if (!question.trim()) e.question = "Question is required";
    const clean = options.filter((o) => o.trim()).slice(0, type === "yes_no" ? 2 : undefined);
    if (type !== "yes_no" && clean.length < 2) e.options = "At least 2 options are required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const clean = options.filter((o) => o.trim());
      const payload = {
        question: question.trim(),
        description: description.trim() || undefined,
        type,
        options: type === "yes_no" ? ["Yes", "No"] : clean,
        startAt: startAt ? `${startAt}T00:00:00Z` : undefined,
        endAt: endAt ? `${endAt}T23:59:59Z` : undefined,
      };
      await pollService.createPoll(payload);
      Alert.alert("Success", "Poll created successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.flex}>
        <AppHeader title="Create Poll" subtitle="Create a new poll" showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <AppInput label="Question" placeholder="e.g. Which vegetable should be added?" value={question} onChangeText={setQuestion} error={errors.question} />
          <AppInput label="Description (optional)" placeholder="e.g. Choose your preferred vegetable." value={description} onChangeText={setDescription} />
          <AppSelect label="Poll Type" value={type} options={POLL_TYPES} onChange={setType} />

          {type !== "yes_no" ? (
            <View style={styles.optionsSection}>
              <Text style={styles.sectionLabel}>Options</Text>
              {options.map((opt, i) => (
                <View key={i} style={styles.optionRow}>
                  <AppInput placeholder={`Option ${i + 1}`} value={opt} onChangeText={(v) => setOption(i, v)} style={styles.optionInput} />
                  {options.length > 2 ? (
                    <Pressable onPress={() => removeOption(i)} style={styles.removeBtn}><Text style={styles.removeText}>✕</Text></Pressable>
                  ) : null}
                </View>
              ))}
              <Pressable style={styles.addBtn} onPress={addOption}><Text style={styles.addBtnText}>+ Add Option</Text></Pressable>
              {errors.options ? <Text style={styles.errorText}>{errors.options}</Text> : null}
            </View>
          ) : null}

          <Pressable style={styles.dateBtn} onPress={() => setStartPicker(true)}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={styles.dateValue}>{startAt || "Select"}</Text>
          </Pressable>
          <Pressable style={styles.dateBtn} onPress={() => setEndPicker(true)}>
            <Text style={styles.dateLabel}>End Date</Text>
            <Text style={styles.dateValue}>{endAt || "Select"}</Text>
          </Pressable>

          <AppButton title="CREATE POLL" onPress={handleSubmit} loading={submitting} disabled={submitting} />
        </ScrollView>
      </SafeAreaView>
      <DatePickerModal visible={startPicker} value={startAt} onClose={() => setStartPicker(false)} onSelect={setStartAt} />
      <DatePickerModal visible={endPicker} value={endAt} onClose={() => setEndPicker(false)} onSelect={setEndAt} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  optionsSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  optionInput: { flex: 1, marginBottom: 0 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.dangerLight, alignItems: "center", justifyContent: "center" },
  removeText: { fontSize: 14, fontWeight: "700", color: COLORS.danger },
  addBtn: { paddingVertical: 10, alignItems: "center" },
  addBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  dateBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#f8fafc", marginBottom: 12 },
  dateLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  dateValue: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
});