import express from "express";
import {
  autoCheckAttendance,
  getAttendanceByDate,
  getAttendanceSummary,
  getMyAttendance,
  getPendingAttendance,
  reviewAttendance,
} from "../controllers/attendance.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// student
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