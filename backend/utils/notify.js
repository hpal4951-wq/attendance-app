import User from "../models/user.model.js";
import { createNotification } from "../controllers/notification.controller.js";

/**
 * Creates an in-app notification for every student account.
 * Used for poll and mess-menu broadcasts.
 */
export const notifyAllStudents = async ({ title, message, type, data }) => {
  try {
    const students = await User.find({ role: "student" }).select("_id");
    await Promise.all(
      students.map((s) => createNotification({ userId: s._id, title, message, type, data }))
    );
  } catch (e) {
    console.error("notifyAllStudents error:", e);
  }
};
