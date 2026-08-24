import { apiGet, apiPost, apiPatch } from "./api";

export async function autoCheckAttendance({
  latitude,
  longitude,
  accuracy,
  slot,
  deviceId,
  isMocked,
}) {
  return apiPost("/attendance/auto-check", {
    latitude,
    longitude,
    accuracy,
    slot,
    deviceId,
    isMocked,
  });
}

export async function getMyAttendance({ month, year, slot } = {}) {
  let query = "/attendance/my";
  const params = [];
  if (month) params.push(`month=${month}`);
  if (year) params.push(`year=${year}`);
  if (slot) params.push(`slot=${slot}`);
  if (params.length) query += "?" + params.join("&");

  return apiGet(query);
}

export async function getAttendanceByDate(date, slot) {
  let query = `/attendance/list?date=${date}`;
  if (slot) query += `&slot=${slot}`;
  return apiGet(query);
}

export async function getWardenAttendance(date, slot) {
  let query = `/attendance/warden?date=${date}`;
  if (slot) query += `&slot=${slot}`;
  return apiGet(query);
}

export async function getAdminAttendance(date, slot) {
  let query = `/attendance/admin?date=${date}`;
  if (slot) query += `&slot=${slot}`;
  return apiGet(query);
}

export async function getAttendanceSummary(date) {
  let query = "/attendance/summary";
  if (date) query += `?date=${date}`;
  return apiGet(query);
}

export async function getPendingAttendance() {
  return apiGet("/attendance/pending");
}

export async function reviewAttendance(id, { status, reason }) {
  return apiPatch(`/attendance/${id}/review`, { status, reason });
}

// ─── Student automatic attendance (Prompt 4) ────────────────
// The backend derives student/hostel/block/room/radius from the JWT.
// The frontend only sends raw location data.

export async function verifyLocation({ latitude, longitude, accuracy, isMocked }) {
  return apiPost("/attendance/verify-location", {
    latitude,
    longitude,
    accuracy,
    isMocked,
  });
}

export async function getTodayAttendance() {
  const res = await apiGet("/attendance/today");
  const data = res?.data || {};
  return {
    date: data.date || null,
    allowedRadius: data.allowedRadius ?? null,
    student: data.student || null,
    records: Array.isArray(data.records) ? data.records : [],
  };
}

export async function getAttendanceHistory(params = {}) {
  return getMyAttendance(params);
}

export async function getAttendanceStatus() {
  const today = await getTodayAttendance();
  return today.records?.[0] || null;
}
