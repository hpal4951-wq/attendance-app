import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";
import {
  registerDeviceToken,
  removeDeviceToken,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many requests. Try again later." },
});

router.use(protect);

router.post("/device-token", tokenLimiter, registerDeviceToken);
router.delete("/device-token", tokenLimiter, removeDeviceToken);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

export default router;