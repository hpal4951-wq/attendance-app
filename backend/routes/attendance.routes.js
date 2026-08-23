import express from "express";
import rateLimit from "express-rate-limit";
import {
  autoCheckAttendance,
  getAttendanceByDate,
  getAttendanceSummary,
  getMyAttendance,
  getPendingAttendance,
  reviewAttendance,
  verifyLocation,
  getTodayAttendance,
} from "../controllers/attendance.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many location verification requests. Try again later." },
});

// student
router.post("/verify-location", locationLimiter, protect, allowRoles("student"), verifyLocation);
router.get("/today", protect, allowRoles("student"), getTodayAttendance);
router.post("/auto-check", protect, allowRoles("student"), autoCheckAttendance);
router.get("/my", protect, allowRoles("student"), getMyAttendance);

// admin / warden
router.get(
  "/list",
  protect,
  allowRoles("admin", "warden"),
  getAttendanceByDate
);

router.get(
  "/summary",
  protect,
  allowRoles("admin", "warden"),
  getAttendanceSummary
);

router.get(
  "/pending",
  protect,
  allowRoles("admin", "warden"),
  getPendingAttendance
);

router.patch(
  "/:id/review",
  protect,
  allowRoles("admin", "warden"),
  reviewAttendance
);

export default router;