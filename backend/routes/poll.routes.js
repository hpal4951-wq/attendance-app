import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import rateLimit from "express-rate-limit";
import {
  getActivePolls, getPollById, getPollResults, getPollHistory,
  submitVote, createPoll, updatePoll, closePoll, deletePoll,
  recomputePollResults, listPolls,
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
router.get("/", allowRoles("warden", "admin"), listPolls);
router.get("/:id", allowRoles("student", "warden", "admin"), getPollById);
router.get("/:id/results", allowRoles("student", "warden", "admin"), getPollResults);

router.post("/:pollId/vote", voteLimiter, allowRoles("student"), submitVote);

router.post("/", allowRoles("admin", "warden"), createPoll);
router.patch("/:id", allowRoles("admin", "warden"), updatePoll);
router.patch("/:id/close", allowRoles("admin", "warden"), closePoll);
router.patch("/:id/recompute", allowRoles("admin", "warden"), recomputePollResults);
router.delete("/:id", allowRoles("admin", "warden"), deletePoll);

export default router;
