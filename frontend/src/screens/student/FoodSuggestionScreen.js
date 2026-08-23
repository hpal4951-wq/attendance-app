import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme";
import { AppHeader, AppInput, AppButton, AppSelect } from "../../components";
import suggestionService from "../../services/suggestionService";
import { getErrorMessage } from "../../utils/error";

const TYPES = [
  { value: "vegetable", label: "Vegetable" },
  { value: "dish", label: "Dish" },
  { value: "breakfast", label: "Breakfast Item" },
  { value: "lunch", label: "Lunch Item" },
  { value: "dinner", label: "Dinner Item" },
  { value: "snack", label: "Snack" },
  { value: "general", label: "General Suggestion" },
];

export default function FoodSuggestionScreen() {
  const navigation = useNavigation();
  const [type, setType] = useState("vegetable");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const e = {};
    if (!title.trim()) e.title = "Food name is required";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      await suggestionService.createSuggestion({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      Alert.alert("Success", "Suggestion submitted successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.flex}>
        <AppHeader title="Suggest Food" subtitle="Tell us what you'd like in the menu" showBack onBack={() => navigation.goBack()} style={styles.header} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <AppSelect label="Suggestion Type" value={type} options={TYPES} onChange={setType} />
          <AppInput label="Food Name" placeholder="e.g. Bhindi Masala" value={title} onChangeText={setTitle} error={errors.title} />
          <AppInput label="Description (optional)" placeholder="e.g. Please include this once next week." value={description} onChangeText={setDescription} />
          <AppButton title="SUBMIT SUGGESTION" onPress={handleSubmit} loading={submitting} disabled={submitting} />
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