import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Linking, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppCard } from "../../components";
import { APP_NAME, APP_VERSION } from "../../constants/config";

export default function AboutScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="About" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppCard style={styles.card}>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.version}>Version {APP_VERSION}</Text>
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.section}>Terms of Service</Text>
          <Text style={styles.text}>By using this application you agree to the terms of service defined by your institution.</Text>
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.section}>Privacy Policy</Text>
          <Text style={styles.text}>
            Location data is collected only for attendance verification. No personal data is shared with third parties.
            Contact your hostel administration for the full privacy policy.
          </Text>
        </AppCard>
        <AppCard style={styles.card}>
          <Text style={styles.section}>Contact</Text>
          <Text style={styles.text}>For support, please contact your hostel administration or the system administrator.</Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 12, padding: 20 },
  appName: { fontSize: 24, fontWeight: "900", color: COLORS.textPrimary, textAlign: "center" },
  version: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", marginTop: 4 },
  section: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
  text: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});