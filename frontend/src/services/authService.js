import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost } from "./api";

export async function loginUser(payload) {
  const res = await apiPost("/auth/login", payload);

  if (res.success && res.token) {
    await AsyncStorage.setItem("token", res.token);
    await AsyncStorage.setItem("user", JSON.stringify(res.user));
  }

  return res;
}

export async function getMyProfile() {
  return apiGet("/auth/me");
}

export async function saveDevice(deviceId) {
  return apiPost("/auth/save-device", { deviceId });
}

export async function logoutUser() {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
}