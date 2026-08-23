import { apiGet, apiPost, apiDelete, apiPatch } from "./api";

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

export async function getNotifications(params = {}) {
  const res = await apiGet(`/notifications${buildQuery(params)}`);
  const notifications = extractList(res);
  const pagination = res?.pagination || { page: 1, limit: 20, total: notifications.length, pages: 1 };
  return { notifications, pagination };
}

export async function getUnreadCount() {
  const res = await apiGet("/notifications/unread-count");
  return res?.data?.count ?? 0;
}

export async function markRead(id) {
  return apiPatch(`/notifications/${id}/read`, {});
}

export async function markAllRead() {
  return apiPatch("/notifications/read-all", {});
}

export async function registerDeviceToken(token, platform = "web") {
  return apiPost("/notifications/device-token", { token, platform });
}

export async function removeDeviceToken(token) {
  return apiDelete("/notifications/device-token", { token });
}

const notificationService = {
  getNotifications, getUnreadCount, markRead, markAllRead, registerDeviceToken, removeDeviceToken,
};
export default notificationService;