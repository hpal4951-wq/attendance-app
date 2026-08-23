import React, { useState, useCallback } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../theme";
import notificationService from "../services/notificationService";

export default function NotificationBell({ navigation, screenName = "Notifications" }) {
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      notificationService
        .getUnreadCount()
        .then((c) => { if (active) setCount(c); })
        .catch(() => {});
      return () => { active = false; };
    }, [])
  );

  return (
    <Pressable
      onPress={() => navigation.navigate(screenName)}
      style={styles.btn}
      accessibilityLabel={`Notifications, ${count} unread`}
      accessibilityRole="button"
      hitSlop={8}
    >
      <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },
});