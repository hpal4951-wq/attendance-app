import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  getDashboard,
  getHostels,
  createHostel,
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

const router = express.Router();

// Every admin endpoint requires an admin JWT
router.use(protect, allowRoles("admin"));

router.get("/dashboard", getDashboard);

router.get("/hostels", getHostels);
router.post("/hostels", createHostel);

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

export default router;
