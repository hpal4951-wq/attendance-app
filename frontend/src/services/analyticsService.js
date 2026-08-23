import { apiGet } from "./api";

function extractData(res) {
  if (res && res.data !== undefined && res.data !== null) return res.data;
  return res;
}

function extractList(res) {
  const data = res?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(res?.students)) return res.students;
  if (Array.isArray(res)) return res;
  return [];
}

export async function getAdminOverview() {
  return extractData(await apiGet("/admin/analytics/overview"));
}
export async function getAdminAttendance(params = {}) {
  return extractData(await apiGet(`/admin/analytics/attendance${buildQuery(params)}`));
}
export async function getAdminMess() {
  return extractData(await apiGet("/admin/analytics/mess"));
}
export async function getLowAttendance() {
  return extractList(await apiGet("/admin/analytics/low-attendance"));
}
export async function getWardenAnalytics() {
  return extractData(await apiGet("/warden/analytics"));
}
export async function getStudentAnalytics() {
  return extractData(await apiGet("/student/analytics"));
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.append(k, v); });
  const s = q.toString();
  return s ? `?${s}` : "";
}

const analyticsService = {
  getAdminOverview, getAdminAttendance, getAdminMess, getLowAttendance, getWardenAnalytics, getStudentAnalytics,
};
export default analyticsService;