import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import notificationService from "./notificationService";

// Foreground behavior: show a non-intrusive in-app banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_IDS = {
  attendance: "attendance",
  mess: "mess",
  polls: "polls",
  general: "general",
};

let tapListener = null;
let responseListener = null;

/**
 * Creates the Android notification channels used by the backend.
 * Must be called once when the app starts (and after a reinstall/rebuild).
 */
export async function configureNotificationChannels() {
  if (Platform.OS !== "android") return;
  const config = [
    { id: CHANNEL_IDS.attendance, name: "Attendance", importance: Notifications.AndroidImportance.HIGH },
    { id: CHANNEL_IDS.mess, name: "Mess Menu", importance: Notifications.AndroidImportance.DEFAULT },
    { id: CHANNEL_IDS.polls, name: "Polls", importance: Notifications.AndroidImportance.DEFAULT },
    { id: CHANNEL_IDS.general, name: "General", importance: Notifications.AndroidImportance.DEFAULT },
  ];
  for (const c of config) {
    try {
      await Notifications.setNotificationChannelAsync(c.id, c);
    } catch (e) {
      console.warn("channel setup error:", e.message);
    }
  }
}

export async function ensurePushPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain) {
      const requested = await Notifications.requestPermissionsAsync();
      return requested.granted;
    }
    return current.granted;
  } catch (e) {
    console.warn("push permission error:", e.message);
    return false;
  }
}

/**
 * Returns the device's FCM token ({ type: "fcm", data }) on Android dev builds,
 * or null when unavailable (permission denied / unsupported runtime).
 */
export async function getPushToken() {
  const granted = await ensurePushPermission();
  if (!granted) return null;
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return token && token.data ? String(token.data) : null;
  } catch (e) {
    console.warn("getDevicePushToken error:", e.message);
    return null;
  }
}

/**
 * Registers the current device token with the backend for the authenticated
 * user. Safe to call on login/session restore; the backend reassigns token
 * ownership to the latest user.
 */
export async function registerForPush() {
  const token = await getPushToken();
  if (!token) return null;
  try {
    await notificationService.registerDeviceToken(token, Platform.OS);
    return token;
  } catch (e) {
    console.warn("push token registration failed:", e.message);
    return null;
  }
}

/**
 * Deactivates the device token on logout so a different user on the same
 * device never receives the previous user's private notifications.
 */
export async function removePushToken() {
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    if (token && token.data) {
      await notificationService.removeDeviceToken(String(token.data));
    }
  } catch (e) {
    console.warn("push token removal skipped:", e.message);
  }
}

/**
 * Handles a tapped notification by navigating to the relevant screen.
 * Uses a navigation ref injected at app startup.
 */
export function handleNotificationTap(data) {
  const { navigationRef } = require("../navigation/navigationRef");
  const navigation = navigationRef.current;
  if (!navigation) return;

  const type = data?.type;
  const pollId = data?.pollId;
  const menuId = data?.menuId;
  const attendanceId = data?.attendanceId;

  try {
    if (type === "poll" && pollId) {
      navigation.navigate("Mess", { screen: "PollDetails", params: { pollId } });
    } else if (type === "mess") {
      navigation.navigate("Mess", { screen: "MessMenu", params: menuId ? { menuId } : undefined });
    } else if (type === "attendance") {
      navigation.navigate("Attendance", { screen: "Attendance" });
    } else {
      navigation.navigate("Notifications");
    }
  } catch (e) {
    // Navigators may not be mounted yet (e.g. tapped while logged out).
    console.warn("notification navigation error:", e.message);
  }
}

/**
 * Registers notification listeners (tap + response). Call once at app startup.
 * Returns a cleanup function.
 */
export function registerNotificationListeners() {
  if (responseListener) return () => {};

  // App killed / backgrounded: notification response (user tapped it).
  responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response?.notification?.request?.content?.data || {};
    handleNotificationTap(data);
  });

  // Foreground banner tap.
  tapListener = Notifications.addNotificationReceivedListener(() => {});

  return () => {
    if (responseListener) responseListener.remove();
    if (tapListener) tapListener.remove();
    responseListener = null;
    tapListener = null;
  };
}

const pushService = {
  configureNotificationChannels,
  ensurePushPermission,
  getPushToken,
  registerForPush,
  removePushToken,
  handleNotificationTap,
  registerNotificationListeners,
  CHANNEL_IDS,
};

export default pushService;
