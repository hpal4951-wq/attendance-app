import Attendance from "../models/attendance.model.js";
import Hostel from "../models/hostel.model.js";
import LocationLog from "../models/locationLog.model.js";
import Room from "../models/room.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import User from "../models/user.model.js";
import { ATTENDANCE_CONFIG } from "../config/attendance.js";
import { haversineDistance } from "../utils/haversine.js";
import {
  defaultSlotByTime,
  getCurrentTimeHHMM,
  getTodayDateString,
  isTimeInRange,
} from "../utils/date.js";
import { decideAttendance } from "../utils/attendanceDecision.js";
import { notifyUser } from "../services/notification.service.js";
import { logAudit } from "../utils/audit.js";

const MAX_ACCEPTABLE_ACCURACY = ATTENDANCE_CONFIG.maxAcceptableAccuracy;

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
      verificationMethod: "gps",
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

    // Defense in depth — the route-level middleware already validates, but we
    // keep the check here in case the route is called from anywhere else.
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      return res.status(400).json({
        success: false,
        code: "INVALID_COORDINATES",
        message: "latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
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
        code: "UNAUTHORIZED",
        message: "Only students can verify attendance location",
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        code: "UNAUTHORIZED",
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
        code: "UNAUTHORIZED",
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

    const radius = hostel.radiusMeters || ATTENDANCE_CONFIG.defaultRadiusMeters;
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

    // Configurable daily attendance window check.
    const currentTime = getCurrentTimeHHMM();
    const windowOpen = isTimeInRange(
      currentTime,
      ATTENDANCE_CONFIG.windowStart,
      ATTENDANCE_CONFIG.windowEnd
    );
    if (!windowOpen) {
      return res.status(400).json({
        success: false,
        code: "ATTENDANCE_WINDOW_CLOSED",
        message: "Attendance verification is currently closed.",
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
      code = "PRESENT";
    } else {
      status = "outside_hostel";
      code = "OUTSIDE";
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
      if (existingForPeriod.status === "present") {
        attendance = existingForPeriod;
        status = "present";
        code = "ALREADY_RECORDED";
      } else if (status === "present") {
        attendance = await Attendance.findByIdAndUpdate(
          existingForPeriod._id,
          {
            status: "present",
            latitude: lat,
            longitude: lng,
            accuracy: accuracy ?? null,
            distanceFromHostel: distance,
            markedAt: new Date(),
            verificationMethod: "gps",
            reason: decision.reason,
          },
          { new: true }
        );
        attendanceMarked = true;
        code = "PRESENT";
      } else {
        attendance = existingForPeriod;
      }
    } else {
      const recordStatus =
        status === "present" ? "present" : status === "outside_hostel" ? "absent" : "pending";
      try {
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
          verificationMethod: "gps",
          reason: decision.reason,
        });
        attendanceMarked = status === "present";
      } catch (createErr) {
        // E11000 = duplicate key (race condition: two concurrent requests).
        // Fetch the existing record and return it gracefully.
        if (createErr.code === 11000) {
          attendance = await Attendance.findOne({ studentId: student._id, date, slot });
          alreadyRecorded = true;
          if (attendance && attendance.status === "present") {
            status = "present";
            code = "ALREADY_RECORDED";
          }
        } else {
          throw createErr;
        }
      }
    }

    // Push notifications — only for meaningful, newly-created events.
    // Dedup keys prevent re-notification on every dashboard open / retry.
    if (attendanceMarked) {
      await notifyUser({
        userId: req.user.id,
        title: "Attendance Verified",
        message: "Your hostel attendance has been automatically verified.",
        type: "attendance",
        data: { status: "present", date, slot, channelId: "attendance" },
        dedupKey: `attendance:${date}:${slot}:present`,
      });
    } else if (!alreadyRecorded && status === "outside_hostel") {
      await notifyUser({
        userId: req.user.id,
        title: "Attendance Not Verified",
        message: "Your current location could not be verified inside the hostel boundary.",
        type: "attendance",
        data: { status: "outside_hostel", date, slot, channelId: "attendance" },
        dedupKey: `attendance:${date}:${slot}:outside`,
      });
    }
    logAudit({ userId: req.user.id, action: "ATTENDANCE_VERIFIED", entity: "Attendance", metadata: { status, distance, code }, req });

    return res.status(200).json({
      success: true,
      data: {
        status,
        code,
        attendanceMarked,
        alreadyRecorded,
        // Predictable alias fields for client consumers:
        distance,
        radius,
        attendanceRecorded: attendanceMarked,
        distanceFromHostel: distance,
        allowedRadius: radius,
        bufferMeters: ATTENDANCE_CONFIG.bufferMeters,
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
      code: "SERVER_ERROR",
      message: "Server error while verifying location",
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

// One status per calendar day. If a student has both a morning and a night
// record for the same date, "present" for any slot wins for the day;
// otherwise the latest record represents the day.
const pickDayRecord = (existing, candidate) => {
  if (!existing) return candidate;
  if (candidate.status === "present" && existing.status !== "present") return candidate;
  if (existing.status !== "present" && candidate.markedAt > existing.markedAt) return candidate;
  return existing;
};

export const getMyMonthlyAttendance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ success: false, message: "Only students can view their attendance" });
    }
    const student = await StudentProfile.findOne({ userId: user._id });
    if (!student) {
      return res.status(404).json({ success: false, code: "STUDENT_PROFILE_NOT_FOUND", message: "Student profile not found" });
    }

    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    if (month < 1 || month > 12) {
      return res.status(400).json({ success: false, code: "INVALID_MONTH", message: "month must be between 1 and 12" });
    }
    if (year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, code: "INVALID_YEAR", message: "invalid year" });
    }

    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const records = await Attendance.find({
      studentId: student._id,
      date: { $regex: `^${prefix}-` },
    }).sort({ date: -1, markedAt: -1 });

    // Reduce to one representative record per day.
    const byDate = new Map();
    records.forEach((r) => {
      byDate.set(r.date, pickDayRecord(byDate.get(r.date), r));
    });

    let presentDays = 0;
    let outsideDays = 0;
    let notVerifiedDays = 0;
    byDate.forEach((r) => {
      if (r.status === "present") presentDays += 1;
      else if (r.status === "absent") outsideDays += 1;
      else notVerifiedDays += 1;
    });

    const totalDays = byDate.size;
    // Authoritative percentage: present days over all recorded days.
    // OUTSIDE and NOT_VERIFIED days are included in the denominator.
    const attendancePercentage = totalDays ? Math.round((presentDays / totalDays) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        month,
        year,
        totalDays,
        presentDays,
        outsideDays,
        notVerifiedDays,
        attendancePercentage,
        records: Array.from(byDate.values()),
      },
    });
  } catch (error) {
    console.error("getMyMonthlyAttendance error:", error);
    return res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Server error while fetching monthly attendance" });
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

// Warden hostel attendance monitor. The warden's authorized scope always comes
// from the authenticated user's DB mapping — a client cannot supply a hostelId.
// Returns every student in the scope with their per-date status, plus a summary
// that includes students with NO record (not verified).
export const getHostelAttendanceByDate = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "warden") {
      return res.status(403).json({ success: false, code: "UNAUTHORIZED", message: "Only wardens can view hostel attendance" });
    }
    const { hostelId, blockId } = user;
    if (!hostelId && !blockId) {
      return res.status(403).json({ success: false, code: "WARDEN_NOT_ASSIGNED", message: "Warden is not assigned to a hostel" });
    }

    const date = req.query.date || getTodayDateString();
    const { search, status } = req.query;

    const scopeQuery = blockId ? { blockId } : { hostelId };

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), "i");
      const [matchingRooms, matchingUsers] = await Promise.all([
        Room.find(blockId ? { blockId, roomNumber: regex } : { hostelId, roomNumber: regex }).select("_id"),
        User.find({ $or: [{ name: regex }, { phone: regex }] }).select("_id"),
      ]);
      scopeQuery.$or = [
        { studentCode: regex },
        { userId: { $in: matchingUsers.map((u) => u._id) } },
        { roomId: { $in: matchingRooms.map((r) => r._id) } },
      ];
    }

    const [totalStudents, students, records] = await Promise.all([
      StudentProfile.countDocuments(scopeQuery),
      StudentProfile.find(scopeQuery)
        .populate([
          { path: "userId", select: "name phone" },
          { path: "roomId", select: "roomNumber" },
        ])
        .sort({ studentCode: 1 }),
      Attendance.find({ date }),
    ]);

    // Best record per student for the date.
    const recordMap = new Map();
    records.forEach((r) => {
      const key = String(r.studentId);
      recordMap.set(key, pickDayRecord(recordMap.get(key), r));
    });

    let present = 0;
    let outside = 0;
    let pending = 0;
    const rows = students.map((s) => {
      const rec = recordMap.get(String(s._id));
      let st;
      if (!rec) st = "not_verified";
      else if (rec.status === "present") { st = "present"; present += 1; }
      else if (rec.status === "absent") { st = "absent"; outside += 1; }
      else { st = "pending"; pending += 1; }
      const room = s.roomId || {};
      const userObj = s.userId || {};
      return {
        studentId: s._id,
        studentCode: s.studentCode,
        name: userObj.name || s.studentCode || "Unknown",
        room: room.roomNumber || s.roomNumber || null,
        status: st,
        verifiedAt: rec ? rec.markedAt : null,
        distance: rec ? rec.distanceFromHostel : null,
        reason: rec ? rec.reason : null,
        verificationMethod: rec ? rec.verificationMethod || "gps" : null,
        slot: rec ? rec.slot : null,
      };
    });

    const notVerified = Math.max(0, totalStudents - (present + outside + pending));

    let filtered = rows;
    if (status && status !== "all") {
      filtered = rows.filter((r) => r.status === status);
    }

    return res.status(200).json({
      success: true,
      date,
      totalStudents,
      summary: { totalStudents, present, outside, pending, notVerified },
      presentPercentage: totalStudents ? Math.round((present / totalStudents) * 100) : 0,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error("getHostelAttendanceByDate error:", error);
    return res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Server error while fetching hostel attendance" });
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
        code: "INVALID_STATUS",
        message: "Invalid status",
      });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Attendance record not found",
      });
    }

    // Warden scope enforcement: a warden may only review students in their own
    // assigned hostel/block. The assignment always comes from the database.
    if (req.user.role === "warden") {
      const warden = await User.findById(req.user.id);
      if (!warden || warden.role !== "warden") {
        return res.status(403).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Not authorized to review this attendance",
        });
      }
      const student = await StudentProfile.findById(attendance.studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          code: "NOT_FOUND",
          message: "Student profile not found",
        });
      }
      if (warden.blockId && String(student.blockId) !== String(warden.blockId)) {
        return res.status(403).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Not authorized to review this attendance",
        });
      }
      if (
        !warden.blockId &&
        warden.hostelId &&
        String(student.hostelId) !== String(warden.hostelId)
      ) {
        return res.status(403).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Not authorized to review this attendance",
        });
      }
      if (!warden.blockId && !warden.hostelId) {
        return res.status(403).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Warden is not assigned to any hostel",
        });
      }
    }

    const oldStatus = attendance.status;
    attendance.status = status;
    attendance.reason = reason || attendance.reason;
    attendance.source = "manual_review";
    attendance.verificationMethod = "manual";

    await attendance.save();

    // Every manual correction is audited — never a silent modification.
    await logAudit({
      userId: req.user.id,
      action: "ATTENDANCE_MANUAL_UPDATE",
      entity: "Attendance",
      entityId: attendance._id,
      metadata: {
        studentId: String(attendance.studentId),
        attendanceId: String(attendance._id),
        oldStatus,
        newStatus: status,
        reason: reason || null,
        changedByRole: req.user.role,
        date: attendance.date,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Attendance reviewed successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("reviewAttendance error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error while reviewing attendance",
    });
  }
};