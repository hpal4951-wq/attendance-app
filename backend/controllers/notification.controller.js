import Notification from "../models/notification.model.js";
import DeviceToken from "../models/deviceToken.model.js";

const badRequest = (res, msg) => res.status(400).json({ success: false, message: msg });
const notFound = (res, msg = "Notification not found") => res.status(404).json({ success: false, message: msg });
const serverError = (res, error) => {
  console.error("notification.controller error:", error);
  return res.status(500).json({ success: false, message: "Server error. Please try again later.", error: error.message });
};

// ─── Create notification (helper, exported for use by other controllers) ───
export const createNotification = async ({ userId, title, message, type = "system", data = {} }) => {
  try {
    await Notification.create({ user: userId, title, message, type, data });
  } catch (e) {
    console.error("createNotification error:", e);
  }
};

// ─── Device token ───────────────────────────────────────────
export const registerDeviceToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token) return badRequest(res, "Token is required");
    await DeviceToken.findOneAndUpdate(
      { token },
      { user: req.user.id, token, platform: platform || "web", lastUsedAt: new Date() },
      { upsert: true, new: true }
    );
    return res.status(200).json({ success: true, message: "Device token registered" });
  } catch (e) { return serverError(res, e); }
};

export const removeDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return badRequest(res, "Token is required");
    await DeviceToken.deleteOne({ token, user: req.user.id });
    return res.status(200).json({ success: true, message: "Device token removed" });
  } catch (e) { return serverError(res, e); }
};

// ─── Notifications ──────────────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const { read, page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };
    if (read === "true" || read === "false") query.read = read === "true";
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
      Notification.countDocuments(query),
    ]);
    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
      pagination: { page: p, limit: l, total, pages: Math.max(1, Math.ceil(total / l)) },
    });
  } catch (e) { return serverError(res, e); }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, read: false });
    return res.status(200).json({ success: true, data: { count } });
  } catch (e) { return serverError(res, e); }
};

export const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return notFound(res);
    return res.status(200).json({ success: true, message: "Marked as read", data: notification });
  } catch (e) { return serverError(res, e); }
};

export const markAllRead = async (req, res) => {
  try {
    const { modifiedCount } = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    return res.status(200).json({ success: true, message: `${modifiedCount} notifications marked as read` });
  } catch (e) { return serverError(res, e); }
};