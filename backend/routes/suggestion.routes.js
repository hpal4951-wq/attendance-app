import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { createSuggestion, getMySuggestions } from "../controllers/suggestion.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", allowRoles("student"), createSuggestion);
router.get("/my", allowRoles("student"), getMySuggestions);

export default router;