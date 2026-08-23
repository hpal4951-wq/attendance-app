import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import rateLimit from "express-rate-limit";
import {
  getActivePolls, getPollById, getPollResults, getPollHistory,
  submitVote, createPoll, updatePoll, closePoll, deletePoll,
} from "../controllers/poll.controller.js";

const router = express.Router();

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many vote attempts. Try again later." },
});

router.use(protect);

// Static routes before parameterized ones
router.get("/active", allowRoles("student", "warden", "admin"), getActivePolls);
router.get("/history", allowRoles("student", "warden", "admin"), getPollHistory);
router.get("/:id", allowRoles("student", "warden", "admin"), getPollById);
router.get("/:id/results", allowRoles("student", "warden", "admin"), getPollResults);

router.post("/:pollId/vote", voteLimiter, allowRoles("student"), submitVote);

router.post("/", allowRoles("admin"), createPoll);
router.patch("/:id", allowRoles("admin"), updatePoll);
router.patch("/:id/close", allowRoles("admin"), closePoll);
router.delete("/:id", allowRoles("admin"), deletePoll);

export default router;