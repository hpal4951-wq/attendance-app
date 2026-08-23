import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import wardenRoutes from "./routes/warden.routes.js";
import pollRoutes from "./routes/poll.routes.js";
import messRoutes from "./routes/mess.routes.js";
import suggestionRoutes from "./routes/suggestion.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import studentRoutes from "./routes/student.routes.js";

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limiting on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many login attempts. Try again later." },
});
app.use("/api/auth/login", loginLimiter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running", timestamp: new Date().toISOString() });
});

// Routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "Attendance Management System API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/warden", wardenRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/mess", messRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/student", studentRoutes);

export default app;