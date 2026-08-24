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
import { validateCoordinates, validateReview } from "../middleware/validate.middleware.js";
import { ATTENDANCE_CONFIG } from "../config/attendance.js";

const router = express.Router();

const locationLimiter = rateLimit({
  windowMs: ATTENDANCE_CONFIG.rateLimit.windowMs,
  max: ATTENDANCE_CONFIG.rateLimit.max,
  message: { success: false, code: "RATE_LIMITED", message: "Too many location verification requests. Try again later." },
});

// student
router.post("/verify-location", locationLimiter, protect, allowRoles("student"), validateCoordinates, verifyLocation);
router.get("/today", protect, allowRoles("student"), getTodayAttendance);
router.post("/auto-check", protect, allowRoles("student"), autoCheckAttendance);
router.get("/my", protect, allowRoles("student"), getMyAttendance);

// warden-only attendance list (assigned hostel/block scope from DB)
router.get("/warden", protect, allowRoles("warden"), getAttendanceByDate);

// admin-only attendance list (all hostels)
router.get("/admin", protect, allowRoles("admin"), getAttendanceByDate);

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
  validateReview,
  reviewAttendance
);

export default router;
