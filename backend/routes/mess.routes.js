import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { getMenu, getTodayMenu, getWeeklyMenu, createMenu, updateMenu, deleteMenu } from "../controllers/mess.controller.js";

const router = express.Router();

router.use(protect);

router.get("/menu/today", allowRoles("admin", "warden", "student"), getTodayMenu);
router.get("/menu/weekly", allowRoles("admin", "warden", "student"), getWeeklyMenu);
router.get("/menu", allowRoles("admin", "warden", "student"), getMenu);
router.post("/menu", allowRoles("admin", "warden"), createMenu);
router.patch("/menu/:id", allowRoles("admin", "warden"), updateMenu);
router.delete("/menu/:id", allowRoles("admin", "warden"), deleteMenu);

export default router;
