import { apiGet } from "./api";

/**
 * Warden API service.
 * All warden endpoints are scoped server-side to the warden's
 * assigned hostel/block — the frontend never sends a hostelId as
 * an authorization mechanism.
 */

function extractData(res) {
  if (res && res.data !== undefined && res.data !== null) return res.data;
  return res;
}

function extractList(res) {
  const data = extractData(res);
  if (Array.isArray(data)) return data;
  if (Array.isArray(res?.records)) return res.records;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      q.append(key, value);
    }
  });
  const str = q.toString();
  return str ? `?${str}` : "";
}

function mapAttendanceRecord(r) {
  if (!r) return null;
  const student = r.studentId || {};
  const user = student.userId || {};
  const room = student.roomId || {};
  return {
    id: r._id,
    studentId: student._id || r.studentId || null,
    studentName: user.name || student.studentCode || "Unknown",
    studentCode: student.studentCode || null,
    roomNumber: room.roomNumber || student.roomNumber || null,
    status: r.status || "pending",
    reason: r.reason || null,
    lastCheckedAt: r.markedAt || r.createdAt || null,
    distanceFromHostel: r.distanceFromHostel ?? null,
    slot: r.slot || null,
    date: r.date || null,
  };
}

// ─── Dashboard ──────────────────────────────────────────────
export async function getWardenDashboard() {
  const data = extractData(await apiGet("/warden/dashboard"));
  return {
    warden: data?.warden || null,
    hostel: data?.hostel || null,
    block: data?.block || null,
    totalStudents: data?.totalStudents ?? 0,
    present: data?.present ?? 0,
    absent: data?.absent ?? 0,
    pending: data?.pending ?? 0,
  };
}

// ─── Students ───────────────────────────────────────────────
export async function getWardenStudents(params = {}) {
  const res = await apiGet(`/warden/students${buildQuery(params)}`);
  const students = extractList(res);
  const pagination = res?.pagination || {
    page: Number(params.page) || 1,
    limit: Number(params.limit) || 20,
    total: students.length,
    pages: students.length ? 1 : 0,
  };
  return { students, pagination };
}

export async function getStudentDetails(studentId) {
  const data = extractData(await apiGet(`/warden/students/${studentId}`));
  const student = data?.student || data || {};
  const user = student.userId || {};
  return {
    _id: student._id || studentId,
    name: user.name || student.name || null,
    phone: user.phone || student.phone || null,
    studentCode: student.studentCode || null,
    course: student.course || null,
    year: student.year || null,
    hostel: student.hostel || null,
    block: student.block || null,
    roomNumber: student.roomNumber || null,
    status: student.status || "active",
    today: (data?.today || []).map(mapAttendanceRecord),
    monthlyAttendance: data?.monthlyAttendance ?? null,
  };
}

// ─── Rooms (for filters, scoped to the warden's block) ──────
export async function getWardenRooms() {
  return extractList(await apiGet("/warden/rooms"));
}

// ─── Attendance monitoring ──────────────────────────────────
export async function getAttendanceMonitor(params = {}) {
  const res = await apiGet(`/attendance/list${buildQuery(params)}`);
  const rawRecords = Array.isArray(res?.data) ? res.data : [];
  const summary = res?.summary || {
    total: rawRecords.length,
    present: 0,
    absent: 0,
    pending: 0,
  };
  return {
    date: res?.date || params?.date || null,
    summary: {
      total: summary.total ?? rawRecords.length,
      present: summary.present ?? 0,
      absent: summary.absent ?? 0,
      pending: summary.pending ?? 0,
    },
    records: rawRecords.map(mapAttendanceRecord).filter(Boolean),
  };
}

// Warden hostel attendance monitor: every student in the warden's authorized
// scope for a date, with per-student status (including not_verified).
export async function getHostelAttendance(params = {}) {
  const res = await apiGet(`/attendance/hostel${buildQuery(params)}`);
  const rows = Array.isArray(res?.data) ? res.data : [];
  const summary = res?.summary || {
    totalStudents: 0,
    present: 0,
    outside: 0,
    pending: 0,
    notVerified: 0,
  };
  return {
    date: res?.date || params?.date || null,
    totalStudents: res?.totalStudents ?? summary.totalStudents ?? rows.length,
    presentPercentage: res?.presentPercentage ?? 0,
    summary,
    records: rows,
  };
}

export async function getPendingAttendance() {
  const res = await apiGet("/attendance/pending");
  const rawRecords = Array.isArray(res?.data) ? res.data : [];
  return rawRecords.map(mapAttendanceRecord).filter(Boolean);
}

const wardenService = {
  getWardenDashboard,
  getWardenStudents,
  getStudentDetails,
  getWardenRooms,
  getAttendanceMonitor,
  getPendingAttendance,
};

export default wardenService;
