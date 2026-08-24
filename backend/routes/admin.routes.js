import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  getDashboard,
  getHostels,
  createHostel,
  updateHostelLocation,
  getBlocks,
  createBlock,
  getRooms,
  createRoom,
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  setStudentStatus,
  assignStudentRoom,
  getWardens,
  createWarden,
} from "../controllers/admin.controller.js";
import { listPolls } from "../controllers/poll.controller.js";
import { getAllSuggestions, updateSuggestionStatus } from "../controllers/suggestion.controller.js";
import { getAdminOverview, getAdminAttendanceAnalytics, getAdminMessAnalytics, getAdminLowAttendance } from "../controllers/analytics.controller.js";
import { getAuditLogs } from "../controllers/audit.controller.js";

const router = express.Router();

// Every admin endpoint requires an admin JWT
router.use(protect, allowRoles("admin"));

router.get("/dashboard", getDashboard);

router.get("/hostels", getHostels);
router.post("/hostels", createHostel);
router.put("/hostels/:id/location", updateHostelLocation);

router.get("/blocks", getBlocks);
router.post("/blocks", createBlock);

router.get("/rooms", getRooms);
router.post("/rooms", createRoom);

router.get("/students", getStudents);
router.post("/students", createStudent);
router.get("/students/:id", getStudentById);
router.patch("/students/:id/assign-room", assignStudentRoom);
router.patch("/students/:id/status", setStudentStatus);
router.patch("/students/:id", updateStudent);

router.get("/staff", getWardens);
router.post("/staff", createWarden);

// Mess module
router.get("/polls", listPolls);
router.get("/suggestions", getAllSuggestions);
router.patch("/suggestions/:id/status", updateSuggestionStatus);

// Analytics + audit
router.get("/analytics/overview", getAdminOverview);
router.get("/analytics/attendance", getAdminAttendanceAnalytics);
router.get("/analytics/mess", getAdminMessAnalytics);
router.get("/analytics/low-attendance", getAdminLowAttendance);
router.get("/audit", getAuditLogs);

export default router;
