import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  getWardenDashboard,
  getWardenStudents,
  getWardenStudentById,
  getWardenRooms,
} from "../controllers/warden.controller.js";
import { getMenu } from "../controllers/mess.controller.js";
import { listPolls, getPollResults } from "../controllers/poll.controller.js";
import { getWardenSuggestions } from "../controllers/suggestion.controller.js";
import { getWardenAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

// Every warden endpoint requires a warden JWT
router.use(protect, allowRoles("warden"));

router.get("/dashboard", getWardenDashboard);
router.get("/rooms", getWardenRooms);
router.get("/students", getWardenStudents);
router.get("/students/:id", getWardenStudentById);

// Mess module
router.get("/mess/menu", getMenu);
router.get("/polls", listPolls);
router.get("/polls/:id/results", getPollResults);
router.get("/suggestions", getWardenSuggestions);

// Analytics
router.get("/analytics", getWardenAnalytics);

export default router;
