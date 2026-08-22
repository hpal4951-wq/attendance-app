import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  getWardenDashboard,
  getWardenStudents,
  getWardenStudentById,
  getWardenRooms,
} from "../controllers/warden.controller.js";

const router = express.Router();

// Every warden endpoint requires a warden JWT
router.use(protect, allowRoles("warden"));

router.get("/dashboard", getWardenDashboard);
router.get("/rooms", getWardenRooms);
router.get("/students", getWardenStudents);
router.get("/students/:id", getWardenStudentById);

export default router;
