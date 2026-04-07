import express from "express";
import { login, me, saveDevice } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", protect, me);
router.post("/save-device", protect, saveDevice);

export default router;