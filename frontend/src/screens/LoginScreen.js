import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { loginUser } from "../services/authService";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!phone.trim() || !password.trim()) {
      setError("Please enter both phone and password");
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser({
        phone: phone.trim(),
        password: password.trim(),
        deviceId: "student-device-001",
      });

      if (res.success) {
        navigation.replace("Home");
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err) {
      setError(err.message || "Something went wrong — is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🏫</Text>
          </View>
          <Text style={styles.appName}>HostelTracker</Text>
          <Text style={styles.tagline}>Smart Attendance Management</Text>
        </View>

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>
            Sign in to continue to your dashboard
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.togglePassword}>
                  {showPassword ? "🙈" : "👁️"}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.loginBtn,
              pressed && styles.loginBtnPressed,
              loading && styles.loginBtnDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </Pressable>

          <View style={styles.testAccounts}>
            <View style={styles.testHeader}>
              <Text style={styles.testIcon}>🧪</Text>
              <Text style={styles.testTitle}>Demo Accounts</Text>
            </View>
            <View style={styles.testDivider} />
            <TestAccountRow role="Admin" phone="7701966924" pass="Admin@123" color={COLORS.secondary} />
            <TestAccountRow role="Warden" phone="9999999992" pass="Warden@123" color={COLORS.primary} />
            <TestAccountRow role="Student" phone="9999999993" pass="Student@123" color={COLORS.success} />
          </View>
        </Animated.View>

        <Text style={styles.footer}>v1.0 · HostelTracker</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TestAccountRow({ role, phone, pass, color }) {
  return (
    <View style={styles.testRow}>
      <View style={[styles.testDot, { backgroundColor: color }]} />
      <View style={styles.testInfo}>
        <Text style={styles.testRole}>{role}</Text>
        <Text style={styles.testCred}>
          {phone} / {pass}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontSize: FONT_SIZE.hero,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxxl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  cardTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  errorIcon: { fontSize: 16 },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    flex: 1,
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: "#f8fafc",
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  togglePassword: {
    fontSize: 18,
    marginLeft: SPACING.sm,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
    minHeight: 54,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  loginBtnDisabled: {
    backgroundColor: "#93c5fd",
    shadowOpacity: 0,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
  },
  testAccounts: {
    marginTop: SPACING.xxl,
    padding: SPACING.lg,
    backgroundColor: "#f8fafc",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  testIcon: { fontSize: 14 },
  testTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  testDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  testDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.md,
  },
  testInfo: { flex: 1 },
  testRole: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  testCred: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  footer: {
    textAlign: "center",
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
  },
});
