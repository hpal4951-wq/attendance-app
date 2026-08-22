import React, { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Animated, StatusBar } from "react-native";
import { COLORS, FONT_SIZE, SPACING } from "../../theme";
import { APP_NAME, APP_TAGLINE } from "../../constants/config";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🏫</Text>
        </View>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        <ActivityIndicator
          size="small"
          color={COLORS.white}
          style={styles.spinner}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xxl,
  },
  logoEmoji: {
    fontSize: 52,
  },
  appName: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FONT_SIZE.md,
    color: "rgba(255,255,255,0.8)",
    marginTop: SPACING.sm,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: SPACING.xxl,
  },
  spinner: {
    marginTop: 40,
  },
});
