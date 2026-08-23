import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { getStudentAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/analytics", protect, allowRoles("student"), getStudentAnalytics);

export default router;