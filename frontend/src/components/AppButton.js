import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../theme";

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) {
  const variants = {
    primary: { bg: COLORS.primary, text: COLORS.white, pressed: COLORS.primaryDark },
    secondary: { bg: COLORS.bg, text: COLORS.textPrimary, pressed: COLORS.border },
    danger: { bg: COLORS.danger, text: COLORS.white, pressed: "#b91c1c" },
    success: { bg: COLORS.success, text: COLORS.white, pressed: "#15803d" },
    ghost: { bg: "transparent", text: COLORS.primary, pressed: COLORS.bg },
  };

  const v = variants[variant] || variants.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? v.pressed : v.bg },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[styles.text, { color: v.text }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    minHeight: 50,
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
  },
  icon: {
    fontSize: 16,
  },
});
