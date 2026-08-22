import { apiPost, apiGet } from "./api";
import {
  setToken as storeToken,
  getToken as fetchToken,
  removeToken as deleteToken,
  setUser as storeUser,
  getUser as fetchUser,
  removeUser as deleteUser,
  clearAuth,
} from "../utils/storage";

export async function loginUser({ phone, password, deviceId }) {
  const data = await apiPost("/auth/login", { phone, password, deviceId });

  if (data.success && data.token) {
    await storeToken(data.token);
    await storeUser(data.user);
  }

  return data;
}

export async function getCurrentUser() {
  return apiGet("/auth/me");
}

export async function logoutUser() {
  await clearAuth();
}

export async function saveToken(token) {
  await storeToken(token);
}

export async function getToken() {
  return fetchToken();
}

export async function removeToken() {
  await deleteToken();
}

export async function saveDevice(deviceId) {
  return apiPost("/auth/save-device", { deviceId });
}
