import { apiGet, apiPatch, apiPost } from "./api";

export async function autoCheckAttendance(payload) {
  return apiPost("/attendance/auto-check", payload);
}

export async function getMyAttendance(query = "") {
  return apiGet(`/attendance/my${query}`);
}

export async function getAttendanceList(date, slot) {
  return apiGet(`/attendance/list?date=${date}&slot=${slot}`);
}

export async function getAttendanceSummary(date) {
  return apiGet(`/attendance/summary?date=${date}`);
}

export async function getPendingAttendance() {
  return apiGet("/attendance/pending");
}

export async function reviewAttendance(id, payload) {
  return apiPatch(`/attendance/${id}/review`, payload);
}