import { apiGet, apiPost, apiPatch } from "./api";

function extractList(res) {
  const data = res?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(res)) return res;
  return [];
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.append(k, v); });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function createSuggestion(data) {
  return apiPost("/suggestions", data);
}
export async function getMySuggestions() {
  return extractList(await apiGet("/suggestions/my"));
}
export async function getAllSuggestions(params = {}) {
  return extractList(await apiGet(`/admin/suggestions${buildQuery(params)}`));
}
export async function updateSuggestionStatus(id, data) {
  return apiPatch(`/admin/suggestions/${id}/status`, data);
}
export async function getWardenSuggestions() {
  return extractList(await apiGet("/warden/suggestions"));
}

const suggestionService = {
  createSuggestion, getMySuggestions, getAllSuggestions, updateSuggestionStatus, getWardenSuggestions,
};
export default suggestionService;