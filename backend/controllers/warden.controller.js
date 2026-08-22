import User from "../models/user.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import Attendance from "../models/attendance.model.js";
import Hostel from "../models/hostel.model.js";
import Block from "../models/block.model.js";
import Room from "../models/room.model.js";
import { getTodayDateString } from "../utils/date.js";

const WARDEN_STUDENT_POPULATE = [
  { path: "userId", select: "name phone isActive" },
  { path: "hostelId", select: "name address" },
  { path: "blockId", select: "name" },
  { path: "roomId", select: "roomNumber floor" },
];

const forbidden = (res, message = "Not authorized to access this resource") =>
  res.status(403).json({ success: false, message });

const notFound = (res, message = "Resource not found") =>
  res.status(404).json({ success: false, message });

const serverError = (res, error) => {
  console.error("warden.controller error:", error);
  return res.status(500).json({
    success: false,
    message: "Server error. Please try again later.",
    error: error.message,
  });
};

const getWardenContext = async (req) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== "warden") return null;
  return { user, hostelId: user.hostelId, blockId: user.blockId };
};

// ─── Dashboard ──────────────────────────────────────────────
export const getWardenDashboard = async (req, res) => {
  try {
    const ctx = await getWardenContext(req);
    if (!ctx) return forbidden(res);

    const { user, hostelId, blockId } = ctx;

    const [hostel, block] = await Promise.all([
      hostelId ? Hostel.findById(hostelId).select("name address") : Promise.resolve(null),
      blockId ? Block.findById(blockId).select("name") : Promise.resolve(null),
    ]);

    const scopeQuery = blockId
      ? { blockId }
      : hostelId
        ? { hostelId }
        : { _id: { $in: [] } };

    const [totalStudents, profiles] = await Promise.all([
      StudentProfile.countDocuments(scopeQuery),
      StudentProfile.find(scopeQuery).select("_id"),
    ]);

    const studentIds = profiles.map((s) => s._id);
    const date = getTodayDateString();
    const records = studentIds.length
      ? await Attendance.find({ studentId: { $in: studentIds }, date })
      : [];

    let present = 0;
    let absent = 0;
    let pending = 0;
    records.forEach((r) => {
      if (r.status === "present") present += 1;
      else if (r.status === "absent") absent += 1;
      else if (r.status === "pending") pending += 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        warden: { _id: user._id, name: user.name, phone: user.phone },
        hostel,
        block,
        totalStudents,
        present,
        absent,
        pending,
      },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

// ─── Student list (scoped to warden's hostel/block) ─────────
export const getWardenStudents = async (req, res) => {
  try {
    const ctx = await getWardenContext(req);
    if (!ctx) return forbidden(res);

    const { hostelId, blockId } = ctx;
    const { search, roomId, status, page = 1, limit = 20 } = req.query;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const baseQuery = blockId ? { blockId } : hostelId ? { hostelId } : { _id: { $in: [] } };
    if (roomId) baseQuery.roomId = roomId;

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), "i");
      const [matchingRooms, matchingUsers] = await Promise.all([
        Room.find({ blockId, roomNumber: regex }).select("_id"),
        User.find({ $or: [{ name: regex }, { phone: regex }] }).select("_id"),
      ]);
      baseQuery.$or = [
        { studentCode: regex },
        { userId: { $in: matchingUsers.map((u) => u._id) } },
        { roomId: { $in: matchingRooms.map((r) => r._id) } },
      ];
    }

    const date = getTodayDateString();
    const allRecords = await Attendance.find({ date });
    const recordMap = {};
    allRecords.forEach((r) => {
      recordMap[String(r.studentId)] = r;
    });

    // Attendance-status filter (must be applied before pagination)
    if (status && status !== "all") {
      let ids = [];
      if (status === "processing") {
        const recorded = new Set(allRecords.map((r) => String(r.studentId)));
        const inScope = await StudentProfile.find(baseQuery).select("_id");
        ids = inScope.filter((s) => !recorded.has(String(s._id))).map((s) => s._id);
      } else {
        ids = allRecords
          .filter((r) => r.status === status && recordMap[String(r.studentId)])
          .map((r) => r.studentId);
      }
      baseQuery._id = { $in: ids };
    }

    const total = await StudentProfile.countDocuments(baseQuery);
    const pages = Math.max(1, Math.ceil(total / l));

    const students = await StudentProfile.find(baseQuery)
      .populate(WARDEN_STUDENT_POPULATE)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l);

    const data = students.map((s) => {
      const rec = recordMap[String(s._id)];
      const room = s.roomId || {};
      return {
        _id: s._id,
        studentCode: s.studentCode,
        name: s.userId?.name || null,
        phone: s.userId?.phone || null,
        roomNumber: room.roomNumber || s.roomNumber || null,
        hostel: s.hostelId?.name || null,
        block: s.blockId?.name || null,
        status: rec ? rec.status : "processing",
        attendanceReason: rec ? rec.reason : null,
        lastCheckedAt: rec ? rec.markedAt : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
      pagination: { page: p, limit: l, total, pages },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

// ─── Student details (scoped) ───────────────────────────────
export const getWardenStudentById = async (req, res) => {
  try {
    const ctx = await getWardenContext(req);
    if (!ctx) return forbidden(res);

    const { hostelId, blockId } = ctx;
    const student = await StudentProfile.findById(req.params.id).populate(
      WARDEN_STUDENT_POPULATE
    );
    if (!student) return notFound(res, "Student not found");

    // Hard scope check — warden must not see students outside their block/hostel
    if (blockId && String(student.blockId) !== String(blockId)) {
      return forbidden(res);
    }
    if (!blockId && hostelId && String(student.hostelId) !== String(hostelId)) {
      return forbidden(res);
    }

    const today = getTodayDateString();
    const [todayRecords, monthRecords] = await Promise.all([
      Attendance.find({ studentId: student._id, date: today }).sort({ markedAt: 1 }),
      Attendance.find({
        studentId: student._id,
        date: { $regex: `^${today.slice(0, 7)}` },
      }),
    ]);

    const presentDays = new Set(
      monthRecords.filter((r) => r.status === "present").map((r) => r.date)
    );
    const recordedDays = new Set(monthRecords.map((r) => r.date));
    const monthlyAttendance = recordedDays.size
      ? Math.round((presentDays.size / recordedDays.size) * 100)
      : 0;

    const user = student.userId || {};
    const room = student.roomId || {};

    return res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          studentCode: student.studentCode,
          name: user.name,
          phone: user.phone,
          course: student.course,
          year: student.year,
          hostel: student.hostelId?.name || null,
          block: student.blockId?.name || null,
          roomNumber: room.roomNumber || student.roomNumber || null,
          status: student.status,
        },
        today: todayRecords,
        monthlyAttendance,
      },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

// ─── Rooms in warden's block (for filters) ──────────────────
export const getWardenRooms = async (req, res) => {
  try {
    const ctx = await getWardenContext(req);
    if (!ctx) return forbidden(res);

    const { blockId, hostelId } = ctx;
    const filter = blockId ? { blockId } : hostelId ? { hostelId } : { _id: { $in: [] } };

    const rooms = await Room.find(filter)
      .select("roomNumber floor capacity occupied status")
      .sort({ roomNumber: 1 });

    return res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    return serverError(res, error);
  }
};
