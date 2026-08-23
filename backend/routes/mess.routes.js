import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { getMenu, getWeeklyMenu, createMenu, updateMenu, deleteMenu } from "../controllers/mess.controller.js";

const router = express.Router();

router.get("/menu", protect, allowRoles("admin", "warden", "student"), getMenu);
router.get("/menu/weekly", protect, allowRoles("admin", "warden", "student"), getWeeklyMenu);
router.post("/menu", protect, allowRoles("admin"), createMenu);
router.patch("/menu/:id", protect, allowRoles("admin"), updateMenu);
router.delete("/menu/:id", protect, allowRoles("admin"), deleteMenu);

export default router;