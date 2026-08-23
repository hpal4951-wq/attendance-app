import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { COLORS, FONT_SIZE, SPACING } from "../theme";

export default function NetworkStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOffline(!state.isConnected);
    });
    return () => unsub();
  }, []);

  if (!offline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You're offline. Some features may be unavailable.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.warning,
    paddingVertical: 6,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
  },
});