import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";

export default function Modal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={styles.buttons}>
          <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelText}>{cancelText}</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, danger ? styles.dangerBtn : styles.confirmBtn]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmText}>{confirmText}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 28,
    width: "85%",
    maxWidth: 380,
    alignItems: "center",
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: COLORS.bg,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: FONT_SIZE.md,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
  },
  dangerBtn: {
    backgroundColor: COLORS.danger,
  },
  confirmText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONT_SIZE.md,
  },
});
