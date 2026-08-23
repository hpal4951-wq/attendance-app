import { apiGet } from "./api";

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

export async function getAuditLogs(params = {}) {
  const res = await apiGet(`/admin/audit${buildQuery(params)}`);
  return { logs: extractList(res), pagination: res?.pagination || { page: 1, limit: 20, total: 0, pages: 1 } };
}

const auditService = { getAuditLogs };
export default auditService;