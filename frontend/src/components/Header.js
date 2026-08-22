import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../theme";

export default function Header({ title, subtitle, onBack, rightAction }) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : null}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightAction ? <View>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
