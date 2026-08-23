import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppCard } from "../../components";

const FAQ = [
  {
    q: "Why is location permission required?",
    a: "Location permission is used to automatically verify whether you are inside the hostel attendance area when checking in. Your location is never stored permanently and is only used for attendance verification.",
  },
  {
    q: "How is attendance calculated?",
    a: "When you tap the Attendance tab, the app sends your current GPS coordinates to the server. The server compares them against your hostel's coordinates and configured radius. If you are within the radius, you are marked Present.",
  },
  {
    q: "Why is my attendance pending?",
    a: "Attendance may be pending if your location accuracy is low, or if the automatic verification is still processing. Warden or Admin can review pending records.",
  },
  {
    q: "Why does attendance show 'Outside hostel area'?",
    a: "This means your current location is further than the hostel's allowed attendance radius from the hostel's registered coordinates. Only the server decides this — the app simply displays the result.",
  },
  {
    q: "How can I vote in a mess poll?",
    a: "Open the Mess tab, go to Active Polls, select a poll, choose your option, and tap Submit Vote. You can only vote once per poll.",
  },
  {
    q: "How do I submit a food suggestion?",
    a: "Open the Mess tab, tap Suggest Food, fill in the type and name of your suggestion, and submit. Admin or Warden will review it.",
  },
];

export default function HelpScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Help & FAQ" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <ScrollView contentContainerStyle={styles.content}>
        {FAQ.map((item, i) => (
          <AppCard key={i} style={styles.card}>
            <Text style={styles.question}>{item.q}</Text>
            <Text style={styles.answer}>{item.a}</Text>
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 12 },
  question: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
  answer: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});