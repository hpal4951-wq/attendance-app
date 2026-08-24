import { apiGet, apiPost, apiPatch, apiPut } from "./api";

/**
 * Small response-normalization layer.
 * The backend returns `{ success, data, ... }`. Some endpoints may
 * return `{ students: [...] }` or `{ records: [...] }` instead of a
 * plain array — handle all shapes here so screens never parse
 * backend responses directly.
 */

function extractData(res) {
  if (res && res.data !== undefined && res.data !== null) return res.data;
  return res;
}

function extractList(res) {
  const data = extractData(res);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.students)) return data.students;
  if (data && Array.isArray(data.records)) return data.records;
  if (data && Array.isArray(data.items)) return data.items;
  if (Array.isArray(res?.students)) return res.students;
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

// ─── Dashboard ──────────────────────────────────────────────
export async function getAdminDashboard() {
  const res = await apiGet("/admin/dashboard");
  const data = extractData(res);
  return {
    totalStudents: data?.totalStudents ?? 0,
    totalWardens: data?.totalWardens ?? 0,
    totalHostels: data?.totalHostels ?? 0,
    totalBlocks: data?.totalBlocks ?? 0,
    totalRooms: data?.totalRooms ?? 0,
    recentActivities: data?.recentActivities || [],
  };
}

// ─── Hostels ────────────────────────────────────────────────
export async function getHostels() {
  return extractList(await apiGet("/admin/hostels"));
}

export async function createHostel(data) {
  return apiPost("/admin/hostels", data);
}

export async function updateHostelLocation(id, data) {
  return apiPut(`/admin/hostels/${id}/location`, data);
}

// ─── Blocks ─────────────────────────────────────────────────
export async function getBlocks(hostelId) {
  return extractList(await apiGet(`/admin/blocks${buildQuery({ hostelId })}`));
}

export async function createBlock(data) {
  return apiPost("/admin/blocks", data);
}

// ─── Rooms ──────────────────────────────────────────────────
export async function getRooms({ blockId, hostelId } = {}) {
  return extractList(await apiGet(`/admin/rooms${buildQuery({ blockId, hostelId })}`));
}

export async function createRoom(data) {
  return apiPost("/admin/rooms", data);
}

// ─── Students ───────────────────────────────────────────────
export async function getStudents(params = {}) {
  const res = await apiGet(`/admin/students${buildQuery(params)}`);
  const students = extractList(res);
  const pagination = res?.pagination || {
    page: Number(params.page) || 1,
    limit: Number(params.limit) || 20,
    total: students.length,
    pages: students.length ? 1 : 0,
  };
  return { students, pagination };
}

export async function createStudent(data) {
  return apiPost("/admin/students", data);
}

export async function getStudentById(id) {
  return extractData(await apiGet(`/admin/students/${id}`));
}

export async function updateStudent(id, data) {
  return apiPatch(`/admin/students/${id}`, data);
}

export async function setStudentStatus(id, status) {
  return apiPatch(`/admin/students/${id}/status`, { status });
}

export async function assignStudentRoom(id, data) {
  return apiPatch(`/admin/students/${id}/assign-room`, data);
}

// ─── Wardens ────────────────────────────────────────────────
export async function getWardens() {
  return extractList(await apiGet("/admin/staff"));
}

export async function createWarden(data) {
  return apiPost("/admin/staff", data);
}

const adminService = {
  getAdminDashboard,
  getHostels,
  createHostel,
  updateHostelLocation,
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
};

export default adminService;
