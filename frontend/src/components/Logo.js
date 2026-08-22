import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, RADIUS } from "../theme";

export default function Logo({ size = 64, showName = false, style }) {
  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>🏫</Text>
      </View>
      {showName ? (
        <Text style={[styles.name, { marginTop: size * 0.2 }]}>
          HostelConnect
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  circle: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emoji: {
    color: COLORS.white,
  },
  name: {
    fontSize: FONT_SIZE.hero,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
});
