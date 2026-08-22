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
