import admin from "firebase-admin";
import Notification from "../models/notification.model.js";
import DeviceToken from "../models/deviceToken.model.js";
import User from "../models/user.model.js";
import StudentProfile from "../models/studentProfile.model.js";

// ─── Firebase Admin lazy initialization ─────────────────────
let firebaseReady = false;
let firebaseAttempted = false;

function initFirebase() {
  if (firebaseAttempted) return;
  firebaseAttempted = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!serviceAccountPath && !(projectId && clientEmail && privateKey)) {
    console.warn("FCM is not configured — push notifications disabled (in-app notifications still work).");
    return;
  }

  try {
    if (serviceAccountPath) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccountPath) });
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          // dotenv may mangle newlines — restore them.
          privateKey: String(privateKey).replace(/\\n/g, "\n"),
        }),
      });
    }
    firebaseReady = true;
    console.log("Firebase Admin initialized (FCM ready)");
  } catch (e) {
    console.error("Firebase Admin init failed:", e.message);
    firebaseAttempted = false; // allow retry on next call
  }
}

const getMessaging = () => {
  initFirebase();
  return firebaseReady ? admin.messaging() : null;
};

// ─── Token lifecycle ────────────────────────────────────────
export const deactivateDeviceToken = async (token) => {
  try {
    await DeviceToken.updateOne({ token }, { isActive: false });
  } catch (e) {
    console.error("deactivateDeviceToken error:", e);
  }
};

// ─── Push delivery ──────────────────────────────────────────
const FCM_BATCH_SIZE = 500; // Firebase multicast limit
const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100; // Expo push service limit per request

const isExpoToken = (token) => typeof token === "string" && token.startsWith("ExponentPushToken[");

// Sends to Expo push tokens (Expo Go / dev clients). Expo's push service
// forwards to FCM/APNs on the device — no Firebase Admin credentials needed.
async function sendExpoPushTokens(tokens, { title, body, data = {}, channelId = "general" }) {
  let success = 0;
  let failed = 0;
  const unique = [...new Set(tokens.filter(Boolean))];

  for (let i = 0; i < unique.length; i += EXPO_BATCH_SIZE) {
    const chunkTokens = unique.slice(i, i + EXPO_BATCH_SIZE);
    const messages = chunkTokens.map((to) => ({
      to,
      title,
      body,
      sound: "default",
      priority: "high",
      channelId,
      data: { ...data, channelId },
    }));
    try {
      const res = await fetch(EXPO_PUSH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
      let json = null;
      try { json = await res.json(); } catch (_) { json = null; }

      if (!res.ok || !Array.isArray(json)) {
        // Error responses (e.g. 400) come back as plain text or an errors object.
        console.error("sendExpoPushTokens error:", res.status, String(json?.errors?.[0]?.message || json?.message || res.statusText || "Bad Request").slice(0, 200));
        failed += chunkTokens.length;
        continue;
      }

      json.forEach((r, idx) => {
        if (r?.status === "ok" || r?.status === 200) {
          success += 1;
        } else {
          failed += 1;
          const err = r?.details?.error || "";
          if (err === "DeviceNotRegistered" || err === "InvalidCredentials") {
            deactivateDeviceToken(chunkTokens[idx]);
          }
        }
      });
    } catch (e) {
      console.error("sendExpoPushTokens chunk error:", e.message);
      failed += chunkTokens.length;
    }
  }
  return { success, failed };
}

// Sends to native FCM tokens via Firebase Admin (dev builds / standalone APK).
async function sendFcmTokens(tokens, { title, body, data = {}, channelId = "general" }) {
  const messaging = getMessaging();
  if (!messaging) return { success: 0, failed: tokens.length };

  const unique = [...new Set(tokens.filter(Boolean))];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < unique.length; i += FCM_BATCH_SIZE) {
    const chunk = unique.slice(i, i + FCM_BATCH_SIZE);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: { ...data, channelId },
        android: {
          priority: "high",
          notification: { channelId },
        },
      });

      response.responses.forEach((r, idx) => {
        if (r.success) {
          success += 1;
        } else {
          failed += 1;
          const err = r.error;
          const code = err && (err.code || err.errorInfo?.code);
          if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
            // Permanently invalid token — stop sending to it.
            deactivateDeviceToken(chunk[idx]);
          }
        }
      });
    } catch (e) {
      console.error("sendFcmTokens batch error:", e.message);
      failed += chunk.length;
    }
  }

  return { success, failed };
}

export async function sendPushToTokens(tokens, payload) {
  const expoTokens = (tokens || []).filter((t) => isExpoToken(t));
  const fcmTokens = (tokens || []).filter((t) => t && !isExpoToken(t));

  let success = 0;
  let failed = 0;

  if (expoTokens.length) {
    const r = await sendExpoPushTokens(expoTokens, payload);
    success += r.success;
    failed += r.failed;
  }
  if (fcmTokens.length) {
    const r = await sendFcmTokens(fcmTokens, payload);
    success += r.success;
    failed += r.failed;
  }

  return { success, failed };
}

export async function sendPushToUser(userId, payload) {
  const tokens = await DeviceToken.find({ user: userId, isActive: true }).select("token");
  return sendPushToTokens(tokens.map((t) => t.token), payload);
}

export async function sendPushToUsers(userIds, payload) {
  const tokens = await DeviceToken.find({ user: { $in: userIds }, isActive: true }).select("token");
  return sendPushToTokens(tokens.map((t) => t.token), payload);
}

// ─── In-app history + push (with dedup) ─────────────────────
const DEFAULT_CHANNELS = {
  attendance: "attendance",
  mess: "mess",
  poll: "polls",
  suggestion: "mess",
  system: "general",
  security: "general",
};

async function dedupExists(userId, type, key) {
  if (!key) return false;
  const existing = await Notification.findOne({
    user: userId,
    type,
    "data._dedupKey": key,
  });
  return !!existing;
}

/**
 * Creates an in-app Notification record and delivers a push notification.
 * Pass `dedupKey` to prevent duplicate notifications for the same event.
 */
export async function notifyUser({
  userId,
  title,
  message,
  type = "system",
  data = {},
  dedupKey = null,
}) {
  try {
    const skip = await dedupExists(userId, type, dedupKey);
    if (skip) return { success: true, duplicate: true };

    await Notification.create({
      user: userId,
      title,
      message,
      type,
      data: dedupKey ? { ...data, _dedupKey: dedupKey } : data,
    });

    const channelId = data.channelId || DEFAULT_CHANNELS[type] || "general";
    const { notification: _n, channelId: _c, ...safeData } = data;
    await sendPushToUser(userId, { title, body: message, data: safeData, channelId });
    return { success: true, duplicate: false };
  } catch (e) {
    console.error("notifyUser error:", e.message);
    return { success: false, duplicate: false };
  }
}

/**
 * Creates in-app records + push for many users (bulk events such as a new
 * menu or a new poll). Records are created only for the given recipients.
 */
export async function notifyUsers({
  userIds,
  title,
  message,
  type = "system",
  data = {},
  dedupKey = null,
}) {
  try {
    const ids = [...new Set((userIds || []).filter(Boolean))];
    if (ids.length === 0) return { success: true, created: 0 };

    // Dedup: only create for users who don't already have this event.
    let targets = ids;
    if (dedupKey) {
      const existing = await Notification.find({
        user: { $in: ids },
        type,
        "data._dedupKey": dedupKey,
      }).select("user");
      const seen = new Set(existing.map((n) => String(n.user)));
      targets = ids.filter((id) => !seen.has(String(id)));
    }
    if (targets.length === 0) return { success: true, created: 0, duplicate: targets.length };

    const docs = targets.map((userId) => ({
      user: userId,
      title,
      message,
      type,
      data: dedupKey ? { ...data, _dedupKey: dedupKey } : data,
    }));
    await Notification.insertMany(docs);

    const channelId = data.channelId || DEFAULT_CHANNELS[type] || "general";
    const { channelId: _c, ...safeData } = data;
    await sendPushToUsers(targets, { title, body: message, data: safeData, channelId });
    return { success: true, created: targets.length };
  } catch (e) {
    console.error("notifyUsers error:", e.message);
    return { success: false, created: 0 };
  }
}

// ─── Recipient resolution ───────────────────────────────────
// Students belonging to a hostel (or all students when hostelId is null).
export async function getHostelStudentIds(hostelId) {
  if (!hostelId) {
    const users = await User.find({ role: "student" }).select("_id");
    return users.map((u) => u._id);
  }
  const profiles = await StudentProfile.find({ hostelId }).select("userId");
  return profiles.filter((p) => p.userId).map((p) => p.userId);
}

export async function notifyHostelStudents({ hostelId, title, message, type = "mess", data = {}, dedupKey }) {
  const userIds = await getHostelStudentIds(hostelId);
  return notifyUsers({ userIds, title, message, type, data, dedupKey });
}

// Warden/Admin staff attached to a hostel (for suggestion alerts).
export async function getHostelStaffIds(hostelId) {
  if (!hostelId) return [];
  const wardenUsers = await User.find({ role: "warden" }).select("_id hostelId blockId");
  const ids = [];
  for (const w of wardenUsers) {
    if (w.hostelId && String(w.hostelId) === String(hostelId)) {
      ids.push(w._id);
    } else if (w.blockId) {
      const profile = await StudentProfile.findOne({ blockId: w.blockId, hostelId }).select("_id");
      if (profile) ids.push(w._id);
    }
  }
  const admins = await User.find({ role: "admin" }).select("_id");
  return [...new Set([...ids.map(String), ...admins.map((a) => String(a._id))])];
}

export async function notifyHostelStaff({ hostelId, title, message, type = "mess", data = {}, dedupKey }) {
  const userIds = await getHostelStaffIds(hostelId);
  return notifyUsers({ userIds, title, message, type, data, dedupKey });
}

// Students eligible for a poll (poll hostel students, or all when global).
export async function notifyPollEligible({ poll, title, message, dedupKey }) {
  const hostelId = poll.isGlobal ? null : poll.hostelId;
  return notifyHostelStudents({ hostelId, title, message, type: "poll", data: { pollId: poll._id }, dedupKey });
}
