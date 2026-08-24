import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
} from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../theme";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { AppInput, AppButton, Logo } from "../../components";
import { isValidPhone } from "../../utils/validators";
import { getOrCreateDeviceId } from "../../utils/storage";

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const getErrorMessage = (err) => {
    const msg = err?.message || "";
    if (msg.includes("401") || msg.toLowerCase().includes("invalid")) {
      return "Invalid phone number or password.";
    }
    if (msg.includes("403") || msg.toLowerCase().includes("not authorized")) {
      return "You are not authorized to access this application.";
    }
    if (msg.includes("Network") || msg.includes("network") || msg.includes("fetch")) {
      return "Unable to connect to server. Please check your internet connection.";
    }
    if (msg.includes("500") || msg.toLowerCase().includes("server error")) {
      return "Server error. Please try again later.";
    }
    return msg || "Something went wrong. Please try again.";
  };

  const handleLogin = async () => {
    setError("");

    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (!isValidPhone(phone.trim())) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    try {
      setLoading(true);
      const deviceId = await getOrCreateDeviceId();
      const res = await login({
        phone: phone.trim(),
        password: password.trim(),
        deviceId,
      });

      if (!res.success) {
        setError(getErrorMessage(res));
      }
      // Navigation happens automatically via AuthContext state change
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Logo size={80} />
          <Text style={styles.appName}>HostelConnect</Text>
          <Text style={styles.tagline}>Smart Hostel Management</Text>
        </View>

        {/* Login Card */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Login to continue</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <AppInput
            label="Phone Number"
            placeholder="+91 Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            icon="📱"
            error={null}
          />

          <AppInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="🔒"
            error={null}
          />

          <AppButton
            title="LOGIN"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />
        </Animated.View>

        <Text style={styles.footer}>v1.0 · HostelConnect</Text>

        {__DEV__ ? (
          <Pressable
            style={({ pressed }) => [styles.devLink, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate("DevRoleSwitcher")}
          >
            <Text style={styles.devLinkText}>Dev Switch Role</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
  appName: {
    fontSize: FONT_SIZE.hero,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -1,
    marginTop: SPACING.lg,
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
  footer: {
    textAlign: "center",
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
  },
  devLink: {
    alignSelf: "center",
    marginTop: SPACING.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.warningLight,
  },
  devLinkText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.warning,
  },
});
