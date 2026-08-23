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

export async function getActivePolls() {
  return extractList(await apiGet("/polls/active"));
}
export async function getPollById(id) {
  return extractData(await apiGet(`/polls/${id}`));
}
export async function submitVote(pollId, optionIds) {
  return apiPost(`/polls/${pollId}/vote`, { optionIds });
}
export async function getPollHistory() {
  return extractList(await apiGet("/polls/history"));
}
export async function getPollResults(id) {
  return extractData(await apiGet(`/polls/${id}/results`));
}
export async function createPoll(data) {
  return apiPost("/polls", data);
}
export async function updatePoll(id, data) {
  return apiPatch(`/polls/${id}`, data);
}
export async function closePoll(id) {
  return apiPatch(`/polls/${id}/close`, {});
}
export async function deletePoll(id) {
  return apiDelete(`/polls/${id}`);
}
export async function getAdminPolls(params = {}) {
  return extractList(await apiGet(`/admin/polls${buildQuery(params)}`));
}
export async function getWardenPolls() {
  return extractList(await apiGet("/warden/polls"));
}

const pollService = {
  getActivePolls, getPollById, submitVote, getPollHistory, getPollResults,
  createPoll, updatePoll, closePoll, deletePoll, getAdminPolls, getWardenPolls,
};
export default pollService;