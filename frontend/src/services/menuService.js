import { apiGet, apiPost, apiPatch, apiDelete } from "./api";

function extractList(res) {
  const data = res?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(res)) return res;
  return [];
}

function extractData(res) {
  if (res && res.data !== undefined && res.data !== null) return res.data;
  return res;
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.append(k, v); });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getMenu(date, hostelId) {
  return extractData(await apiGet(`/mess/menu${buildQuery({ date, hostelId })}`));
}
export async function getMenuToday() {
  return extractData(await apiGet("/mess/menu/today"));
}
export async function getWeeklyMenu() {
  return extractData(await apiGet("/mess/menu/weekly"));
}
export async function createMenu(data) {
  return apiPost("/mess/menu", data);
}
export async function updateMenu(id, data) {
  return apiPatch(`/mess/menu/${id}`, data);
}
export async function deleteMenu(id) {
  return apiDelete(`/mess/menu/${id}`);
}

const menuService = { getMenu, getMenuToday, getWeeklyMenu, createMenu, updateMenu, deleteMenu };
export default menuService;
