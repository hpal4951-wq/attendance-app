import Attendance from "../models/attendance.model.js";
import Hostel from "../models/hostel.model.js";
import LocationLog from "../models/locationLog.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import User from "../models/user.model.js";
import { haversineDistance } from "../utils/haversine.js";
import {
  defaultSlotByTime,
  getCurrentTimeHHMM,
  getTodayDateString,
  isTimeInRange,
} from "../utils/date.js";
import { decideAttendance } from "../utils/attendanceDecision.js";
import { createNotification } from "./notification.controller.js";
import { logAudit } from "../utils/audit.js";

const MAX_ACCEPTABLE_ACCURACY =
  Number(process.env.MAX_ACCEPTABLE_ACCURACY) || 100;

// Determines the data scope for attendance listing endpoints.
// admin → all records; warden → records for the warden's hostel/block only.
const getAttendanceScope = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  if (user.role === "admin") return { all: true };
  if (user.role === "warden") {
    return { all: false, hostelId: user.hostelId, blockId: user.blockId };
  }
  return { all: false, studentSelf: true };
};

// Returns the current attendance slot if the current time falls inside
// one of the hostel's configured windows, otherwise null.
const getCurrentSlot = (windows = []) => {
  const now = getCurrentTimeHHMM();
  const found = windows.find((w) => isTimeInRange(now, w.startTime, w.endTime));
  return found ? found.slot : null;
};

export const autoCheckAttendance = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, slot, deviceId, isMocked = false } =
      req.body;

    if (!latitude || !longitude || !slot) {
      return res.status(400).json({
        success: false,
        message: "latitude, longitude and slot are required",
      });
    }

    if (!["morning", "night"].includes(slot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can mark attendance",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User is inactive",
      });
    }

    const student = await StudentProfile.findOne({ userId: user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    if (student.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Student profile is not active",
      });
    }

    const hostel = await Hostel.findById(user.hostelId);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found",
      });
    }

    const windowObj = hostel.attendanceWindows.find((w) => w.slot === slot);
    if (!windowObj) {
      return res.status(400).json({
        success: false,
        message: `Attendance window not configured for ${slot}`,
      });
    }

    const currentTime = getCurrentTimeHHMM();
    const allowed = isTimeInRange(
      currentTime,
      windowObj.startTime,
      windowObj.endTime
    );

    if (!allowed) {
      return res.status(400).json({
        success: false,
        message: `Attendance window closed for ${slot}`,
      });
    }

    const date = getTodayDateString();

    const existing = await Attendance.findOne({
      studentId: student._id,
      date,
      slot,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Attendance already marked",
        data: existing,
      });
    }

    if (user.deviceId && deviceId && user.deviceId !== deviceId) {
      return res.status(403).json({
        success: false,
        message: "Device mismatch detected",
      });
    }

    await LocationLog.create({
      studentId: student._id,
      latitude,
      longitude,
      accuracy,
      isMocked,
      source: "attendance_auto_check",
    });

    const distance = haversineDistance(
      latitude,
      longitude,
      hostel.latitude,
      hostel.longitude
    );

    const decision = decideAttendance({
      distance,
      radiusMeters: hostel.radiusMeters,
      accuracy,
      isMocked,
    });

    const attendance = await Attendance.create({
      studentId: student._id,
      hostelId: hostel._id,
      date,
      slot,
      status: decision.status,
      latitude,
      longitude,
      accuracy,
      distanceFromHostel: distance,
      markedAt: new Date(),
      source: "auto_location",
      reason: decision.reason,
    });

    return res.status(201).json({
      success: true,
      message: "Attendance processed successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("autoCheckAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing attendance",
      error: error.message,
    });
  }
};

export const verifyLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, isMocked = false } = req.body;

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      return res.status(400).json({
        success: false,
        code: "INVALID_COORDINATES",
        message: "latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        code: "INVALID_COORDINATES",
        message: "Invalid coordinates provided",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can verify attendance location",
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User is inactive",
      });
    }

    const student = await StudentProfile.findOne({ userId: user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        code: "STUDENT_PROFILE_NOT_FOUND",
        message: "Student profile not found",
      });
    }
    if (student.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Student profile is not active",
      });
    }

    // The backend derives the hostel + radius from the database — never from the client
    const hostel = await Hostel.findById(user.hostelId || student.hostelId);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        code: "HOSTEL_NOT_ASSIGNED",
        message: "No hostel is assigned to this student",
      });
    }

    const radius = hostel.radiusMeters;
    if (
      hostel.latitude === undefined ||
      hostel.latitude === null ||
      hostel.longitude === undefined ||
      hostel.longitude === null ||
      !radius ||
      radius <= 0
    ) {
      return res.status(404).json({
        success: false,
        code: "HOSTEL_LOCATION_NOT_CONFIGURED",
        message: "Hostel attendance location is not configured",
      });
    }

    const distance = haversineDistance(lat, lng, hostel.latitude, hostel.longitude);

    await LocationLog.create({
      studentId: student._id,
      latitude: lat,
      longitude: lng,
      accuracy: accuracy ?? null,
      isMocked,
      source: "attendance_verify_location",
    });

    // Backend is the authority: it decides the result. Client sends raw GPS only.
    const decision = decideAttendance({
      distance,
      radiusMeters: radius,
      accuracy: accuracy ?? null,
      isMocked,
      maxAccuracy: MAX_ACCEPTABLE_ACCURACY,
    });

    let status;
    let code;
    if (isMocked) {
      status = "location_unavailable";
      code = "LOCATION_SUSPECTED";
    } else if (decision.status === "pending") {
      status = "location_unavailable";
      code = "LOCATION_ACCURACY_LOW";
    } else if (decision.status === "present") {
      status = "present";
      code = "INSIDE_RADIUS";
    } else {
      status = "outside_hostel";
      code = "OUTSIDE_RADIUS";
    }

    // Business rule: once PRESENT for a period, never downgrade to outside/absent.
    const date = getTodayDateString();
    const slot = getCurrentSlot(hostel.attendanceWindows) || defaultSlotByTime();
    const existingForPeriod = await Attendance.findOne({
      studentId: student._id,
      date,
      slot,
    });
    let attendance = null;
    let attendanceMarked = false;
    let alreadyRecorded = false;

    if (existingForPeriod) {
      alreadyRecorded = true;
      // A present record is final for the period — do not change it.
      if (existingForPeriod.status === "present") {
        attendance = existingForPeriod;
        status = "present";
        code = "ALREADY_PRESENT";
      } else if (status === "present") {
        // Upgrade a pending/absent record to present once verified inside.
        attendance = await Attendance.findByIdAndUpdate(
          existingForPeriod._id,
          {
            status: "present",
            latitude: lat,
            longitude: lng,
            accuracy: accuracy ?? null,
            distanceFromHostel: distance,
            markedAt: new Date(),
            reason: decision.reason,
          },
          { new: true }
        );
        attendanceMarked = true;
        code = "INSIDE_RADIUS";
      } else {
        // Outside / unavailable — keep the existing (non-present) record.
        attendance = existingForPeriod;
      }
    } else {
      const recordStatus =
        status === "present" ? "present" : status === "outside_hostel" ? "absent" : "pending";
      attendance = await Attendance.create({
        studentId: student._id,
        hostelId: hostel._id,
        date,
        slot,
        status: recordStatus,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ?? null,
        distanceFromHostel: distance,
        markedAt: new Date(),
        source: "auto_location",
        reason: decision.reason,
      });
      attendanceMarked = status === "present";
    }

    // Non-spammy notification — only when a fresh record is persisted.
    if (attendanceMarked || (!alreadyRecorded && status !== "present")) {
      const notifMap = {
        present: ["Attendance verified", "Attendance verified successfully."],
        outside_hostel: ["Outside hostel area", "Your location was outside the allowed hostel area."],
        location_unavailable: ["Attendance not verified", "Attendance could not be verified because location was unavailable."],
      };
      const notif = notifMap[status];
      if (notif) {
        createNotification({ userId: req.user.id, title: notif[0], message: notif[1], type: "attendance", data: { status, date } });
      }
    }
    logAudit({ userId: req.user.id, action: "ATTENDANCE_VERIFIED", entity: "Attendance", metadata: { status, distance, code }, req });

    return res.status(200).json({
      success: true,
      data: {
        status,
        code,
        attendanceMarked,
        alreadyRecorded,
        distanceFromHostel: distance,
        allowedRadius: radius,
        accuracy: accuracy ?? null,
        reason: decision.reason,
        slot,
        verifiedAt: new Date(),
        attendance: attendance
          ? { _id: attendance._id, date: attendance.date, slot: attendance.slot, status: attendance.status }
          : null,
      },
    });
  } catch (error) {
    console.error("verifyLocation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying location",
      error: error.message,
    });
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can view their attendance",
      });
    }

    const student = await StudentProfile.findOne({ userId: user._id })
      .populate({ path: "hostelId", select: "name address radiusMeters" })
      .populate({ path: "blockId", select: "name" })
      .populate({ path: "roomId", select: "roomNumber floor" });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const date = getTodayDateString();
    const records = await Attendance.find({ studentId: student._id, date }).sort({
      markedAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: {
        date,
        allowedRadius: student.hostelId?.radiusMeters ?? null,
        student: {
          studentCode: student.studentCode,
          hostel: student.hostelId || null,
          block: student.blockId || null,
          room: student.roomId || null,
        },
        records,
      },
    });
  } catch (error) {
    console.error("getTodayAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching today's attendance",
      error: error.message,
    });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const student = await StudentProfile.findOne({ userId: user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const { month, year, slot } = req.query;
    const query = { studentId: student._id };

    if (month && year) {
      query.date = new RegExp(`^${year}-${String(month).padStart(2, "0")}-`);
    }

    if (slot) {
      query.slot = slot;
    }

    const records = await Attendance.find(query).sort({ date: -1, markedAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("getMyAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching attendance",
      error: error.message,
    });
  }
};

export const getAttendanceByDate = async (req, res) => {
  try {
    const { date, slot } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "date query is required",
      });
    }

    const scope = await getAttendanceScope(req.user.id);
    if (!scope || scope.studentSelf) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions",
      });
    }

    const query = { date };
    if (slot) query.slot = slot;

    if (!scope.all) {
      const students = scope.blockId
        ? await StudentProfile.find({ blockId: scope.blockId }).select("_id")
        : scope.hostelId
          ? await StudentProfile.find({ hostelId: scope.hostelId }).select("_id")
          : [];
      query.studentId = { $in: students.map((s) => s._id) };
    }

    const records = await Attendance.find(query)
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name phone" },
          { path: "roomId", select: "roomNumber" },
        ],
      })
      .sort({ createdAt: -1 });

    const summary = { total: 0, present: 0, absent: 0, pending: 0 };
    records.forEach((r) => {
      summary.total += 1;
      if (r.status === "present") summary.present += 1;
      else if (r.status === "absent") summary.absent += 1;
      else summary.pending += 1;
    });

    return res.status(200).json({
      success: true,
      count: records.length,
      summary,
      date,
      data: records,
    });
  } catch (error) {
    console.error("getAttendanceByDate error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching attendance list",
      error: error.message,
    });
  }
};

export const getAttendanceSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const selectedDate = date || getTodayDateString();

    const summary = await Attendance.aggregate([
      { $match: { date: selectedDate } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      date: selectedDate,
      data: summary,
    });
  } catch (error) {
    console.error("getAttendanceSummary error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching summary",
      error: error.message,
    });
  }
};

export const getPendingAttendance = async (req, res) => {
  try {
    const scope = await getAttendanceScope(req.user.id);
    if (!scope || scope.studentSelf) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions",
      });
    }

    const query = { status: "pending" };

    if (!scope.all) {
      const students = scope.blockId
        ? await StudentProfile.find({ blockId: scope.blockId }).select("_id")
        : scope.hostelId
          ? await StudentProfile.find({ hostelId: scope.hostelId }).select("_id")
          : [];
      query.studentId = { $in: students.map((s) => s._id) };
    }

    const records = await Attendance.find(query)
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name phone" },
          { path: "roomId", select: "roomNumber" },
        ],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("getPendingAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching pending attendance",
      error: error.message,
    });
  }
};

export const reviewAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["present", "absent", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    attendance.status = status;
    attendance.reason = reason || attendance.reason;
    attendance.source = "manual_review";

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Attendance reviewed successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("reviewAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while reviewing attendance",
      error: error.message,
    });
  }
};