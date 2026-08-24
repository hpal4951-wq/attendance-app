import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { AppHeader, AppButton, AppCard, LoadingScreen } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { getOrCreateDeviceId } from "../../utils/storage";

// Dev-only test accounts (match backend/seed.js). These call the REAL login
// API — the backend returns the real JWT and role. This does NOT modify any
// role, and gives NO extra backend permissions.
const TEST_ACCOUNTS = [
  { label: "Admin Dashboard", icon: "🏢", phone: "7701966924", password: "Admin@123" },
  { label: "Warden Dashboard", icon: "🛡️", phone: "9999999992", password: "Warden@123" },
  { label: "Student Dashboard", icon: "🎓", phone: "9999999993", password: "Student@123" },
];

export default function DevRoleSwitcherScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [loading, setLoading] = useState("");

  const handleLogin = async (account) => {
    if (loading) return;
    setLoading(account.label);
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await login({ phone: account.phone, password: account.password, deviceId });
      if (!res.success) {
        Alert.alert("Error", res.message || "Login failed");
      }
      // Navigation happens automatically via AuthContext → AppNavigator
    } catch (err) {
      Alert.alert("Error", err?.message || "Unable to connect to server.");
    } finally {
      setLoading("");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Dev Role Switcher" subtitle="UI testing only — uses real test accounts" showBack onBack={() => navigation.goBack()} style={styles.header} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppCard style={styles.warnCard}>
          <Text style={styles.warnTitle}>⚠️ Development Only</Text>
          <Text style={styles.warnText}>
            This screen is hidden in production builds. It logs in with pre-seeded test accounts through the real API.
            It does NOT modify the JWT role and grants no backend permissions.
          </Text>
        </AppCard>

        {TEST_ACCOUNTS.map((a) => (
          <AppButton
            key={a.phone}
            title={`${a.icon}  ${a.label}`}
            onPress={() => handleLogin(a)}
            loading={loading === a.label}
            disabled={loading !== ""}
            style={styles.btn}
          />
        ))}

        <Text style={styles.note}>
          Production: login with different role accounts. Testing: use this switcher.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  warnCard: { marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  warnTitle: { fontSize: 15, fontWeight: "800", color: COLORS.warning, marginBottom: 6 },
  warnText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  btn: { marginBottom: 12 },
  note: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 12 },
});