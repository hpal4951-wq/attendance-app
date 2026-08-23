import User from "../models/user.model.js";
import StudentProfile from "../models/studentProfile.model.js";
import Attendance from "../models/attendance.model.js";
import Hostel from "../models/hostel.model.js";
import Block from "../models/block.model.js";
import Poll from "../models/poll.model.js";
import Suggestion from "../models/suggestion.model.js";
import { getTodayDateString, shiftDate } from "../utils/date.js";

const serverError = (res, error) => {
  console.error("analytics.controller error:", error);
  return res.status(500).json({ success: false, message: "Server error. Please try again.", error: error.message });
};

const WARNING_THRESHOLD = Number(process.env.ATTENDANCE_WARNING_THRESHOLD) || 75;

// Helper: compute attendance % for a student over the last N days (unique days)
const getStudentAttendancePercent = async (studentId, daysBack = 30) => {
  const start = shiftDate(getTodayDateString(), -daysBack);
  const records = await Attendance.find({
    studentId,
    date: { $gte: start },
  });
  const presentDays = new Set(records.filter((r) => r.status === "present").map((r) => r.date));
  const recordedDays = new Set(records.map((r) => r.date));
  if (!recordedDays.size) return null;
  return Math.round((presentDays.size / recordedDays.size) * 100);
};

// Helper: get attendance percent for multiple students
const getAttendancePercentMap = async (studentIds, daysBack = 30) => {
  const start = shiftDate(getTodayDateString(), -daysBack);
  const records = await Attendance.find({ studentId: { $in: studentIds }, date: { $gte: start } });
  const map = {};
  studentIds.forEach((id) => { map[String(id)] = { present: new Set(), recorded: new Set() }; });
  records.forEach((r) => {
    const key = String(r.studentId);
    if (map[key]) {
      map[key].recorded.add(r.date);
      if (r.status === "present") map[key].present.add(r.date);
    }
  });
  const result = {};
  Object.entries(map).forEach(([id, v]) => {
    result[id] = v.recorded.size ? Math.round((v.present.size / v.recorded.size) * 100) : null;
  });
  return result;
};

// ─── Admin overview ─────────────────────────────────────────
export const getAdminOverview = async (req, res) => {
  try {
    const today = getTodayDateString();
    const [totalStudents, totalHostels, totalWardens, activePolls, pendingSuggestions, allStudents] = await Promise.all([
      StudentProfile.countDocuments({}),
      Hostel.countDocuments({}),
      User.countDocuments({ role: "warden" }),
      Poll.countDocuments({ closed: { $ne: true }, endAt: { $gte: new Date() } }),
      Suggestion.countDocuments({ status: "pending" }),
      StudentProfile.find({}).select("_id"),
    ]);
    const studentIds = allStudents.map((s) => s._id);
    const todayRecords = studentIds.length ? await Attendance.find({ studentId: { $in: studentIds }, date: today }) : [];
    let present = 0, outside = 0, pending = 0;
    todayRecords.forEach((r) => {
      if (r.status === "present") present += 1;
      else if (r.status === "absent") outside += 1;
      else pending += 1;
    });
    const pctMap = await getAttendancePercentMap(studentIds);
    let lowCount = 0;
    Object.values(pctMap).forEach((pct) => { if (pct !== null && pct < WARNING_THRESHOLD) lowCount += 1; });
    return res.status(200).json({
      success: true,
      data: {
        totalStudents, totalHostels, totalWardens,
        todayAttendance: { present, outside, pending },
        activePolls, pendingSuggestions,
        lowAttendanceCount: lowCount,
        attendanceWarningThreshold: WARNING_THRESHOLD,
      },
    });
  } catch (e) { return serverError(res, e); }
};

// ─── Admin attendance analytics ─────────────────────────────
export const getAdminAttendanceAnalytics = async (req, res) => {
  try {
    const today = getTodayDateString();
    const allStudents = await StudentProfile.find({}).select("_id");
    const ids = allStudents.map((s) => s._id);
    // Today
    const todayRecords = ids.length ? await Attendance.find({ studentId: { $in: ids }, date: today }) : [];
    const todaySummary = { present: 0, absent: 0, pending: 0 };
    todayRecords.forEach((r) => { if (r.status === "present") todaySummary.present += 1; else if (r.status === "absent") todaySummary.absent += 1; else todaySummary.pending += 1; });
    // Weekly (last 7 days)
    const weekStart = shiftDate(today, -6);
    const weekRecords = ids.length ? await Attendance.find({ studentId: { $in: ids }, date: { $gte: weekStart, $lte: today } }) : [];
    const weekPresent = new Set();
    weekRecords.forEach((r) => { if (r.status === "present") weekPresent.add(`${String(r.studentId)}-${r.date}`); });
    const weekTotal = allStudents.length * 7;
    const weeklyPercent = weekTotal ? Math.round((weekPresent.size / weekTotal) * 100) : 0;
    // Monthly
    const monthStart = `${today.slice(0, 7)}-01`;
    const monthRecords = ids.length ? await Attendance.find({ studentId: { $in: ids }, date: { $gte: monthStart, $lte: today } }) : [];
    const monthPresent = new Set();
    monthRecords.forEach((r) => { if (r.status === "present") monthPresent.add(`${String(r.studentId)}-${r.date}`); });
    const monthDays = new Set(monthRecords.map((r) => r.date)).size || 1;
    const monthPossible = allStudents.length * monthDays;
    const monthlyPercent = monthPossible ? Math.round((monthPresent.size / monthPossible) * 100) : 0;
    // Hostel-wise
    const hostels = await Hostel.find({});
    const hostelWise = await Promise.all(hostels.map(async (h) => {
      const students = await StudentProfile.find({ hostelId: h._id }).select("_id");
      const sIds = students.map((s) => s._id);
      const recs = sIds.length ? await Attendance.find({ studentId: { $in: sIds }, date: today }) : [];
      const p = recs.filter((r) => r.status === "present").length;
      return { hostelId: h._id, hostelName: h.name, total: sIds.length, present: p, percent: sIds.length ? Math.round((p / sIds.length) * 100) : 0 };
    }));
    return res.status(200).json({ success: true, data: { today: todaySummary, weeklyPercent, monthlyPercent, hostelWise } });
  } catch (e) { return serverError(res, e); }
};

// ─── Admin mess analytics ───────────────────────────────────
export const getAdminMessAnalytics = async (req, res) => {
  try {
    const polls = await Poll.find({});
    const activePolls = polls.filter((p) => !p.closed && (!p.endAt || new Date(p.endAt) > new Date())).length;
    let totalVotes = 0;
    let mostVoted = { text: "", votes: 0 };
    polls.forEach((p) => {
      (p.options || []).forEach((o) => {
        totalVotes += o.votes || 0;
        if ((o.votes || 0) > mostVoted.votes) mostVoted = { text: o.text, votes: o.votes || 0 };
      });
    });
    const [approved, implemented, rejected, pending] = await Promise.all([
      Suggestion.countDocuments({ status: "approved" }),
      Suggestion.countDocuments({ status: "implemented" }),
      Suggestion.countDocuments({ status: "rejected" }),
      Suggestion.countDocuments({ status: "pending" }),
    ]);
    return res.status(200).json({ success: true, data: { activePolls, totalVotes, mostVoted, suggestionCounts: { approved, implemented, rejected, pending } } });
  } catch (e) { return serverError(res, e); }
};

// ─── Admin low attendance ───────────────────────────────────
export const getAdminLowAttendance = async (req, res) => {
  try {
    const students = await StudentProfile.find({}).populate([
      { path: "userId", select: "name phone" },
      { path: "hostelId", select: "name" },
      { path: "blockId", select: "name" },
      { path: "roomId", select: "roomNumber" },
    ]);
    const ids = students.map((s) => s._id);
    const pctMap = await getAttendancePercentMap(ids);
    const data = students
      .map((s) => {
        const pct = pctMap[String(s._id)];
        return {
          _id: s._id, name: s.userId?.name, studentCode: s.studentCode,
          hostel: s.hostelId?.name, block: s.blockId?.name, room: s.roomId?.roomNumber,
          attendancePercent: pct,
        };
      })
      .filter((s) => s.attendancePercent !== null && s.attendancePercent < WARNING_THRESHOLD)
      .sort((a, b) => a.attendancePercent - b.attendancePercent);
    return res.status(200).json({ success: true, count: data.length, threshold: WARNING_THRESHOLD, data });
  } catch (e) { return serverError(res, e); }
};

// ─── Warden analytics ───────────────────────────────────────
export const getWardenAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "warden") return res.status(403).json({ success: false, message: "Not authorized" });
    const { hostelId, blockId } = user;
    const scopeQuery = blockId ? { blockId } : hostelId ? { hostelId } : { _id: { $in: [] } };
    const [students, hostel, block] = await Promise.all([
      StudentProfile.find(scopeQuery).select("_id"),
      hostelId ? Hostel.findById(hostelId).select("name") : null,
      blockId ? Block.findById(blockId).select("name") : null,
    ]);
    const ids = students.map((s) => s._id);
    const today = getTodayDateString();
    const todayRecords = ids.length ? await Attendance.find({ studentId: { $in: ids }, date: today }) : [];
    let present = 0, outside = 0, pending = 0;
    todayRecords.forEach((r) => { if (r.status === "present") present += 1; else if (r.status === "absent") outside += 1; else pending += 1; });
    const total = ids.length;
    const attendancePercent = total ? Math.round(((present) / total) * 100) : 0;
    const pctMap = await getAttendancePercentMap(ids);
    let lowCount = 0;
    Object.values(pctMap).forEach((pct) => { if (pct !== null && pct < WARNING_THRESHOLD) lowCount += 1; });
    return res.status(200).json({
      success: true,
      data: {
        hostel: hostel ? { name: hostel.name } : null,
        block: block ? { name: block.name } : null,
        totalStudents: total, present, outside, pending,
        attendancePercent, lowAttendanceCount: lowCount,
        attendanceWarningThreshold: WARNING_THRESHOLD,
      },
    });
  } catch (e) { return serverError(res, e); }
};

// ─── Student analytics ──────────────────────────────────────
export const getStudentAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") return res.status(403).json({ success: false, message: "Not authorized" });
    const student = await StudentProfile.findOne({ userId: user._id });
    if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });
    const pct = await getStudentAttendancePercent(student._id);
    const today = getTodayDateString();
    const todayRecords = await Attendance.find({ studentId: student._id, date: today }).sort({ markedAt: -1 });
    const latest = todayRecords[0] || null;
    return res.status(200).json({
      success: true,
      data: {
        totalStudents: 0, // scoped, not needed for student
        todayStatus: latest ? latest.status : "processing",
        todayDistance: latest?.distanceFromHostel || null,
        monthlyAttendancePercent: pct,
        attendanceWarningThreshold: WARNING_THRESHOLD,
      },
    });
  } catch (e) { return serverError(res, e); }
};