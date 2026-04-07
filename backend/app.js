import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Attendance Management System API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);

export default app;
