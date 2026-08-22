import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/config";

// ─── Token ───
export async function setToken(token) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (e) {
    console.warn("storage.setToken error:", e);
  }
}

export async function getToken() {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (e) {
    console.warn("storage.getToken error:", e);
    return null;
  }
}

export async function removeToken() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (e) {
    console.warn("storage.removeToken error:", e);
  }
}

// ─── User ───
export async function setUser(user) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  } catch (e) {
    console.warn("storage.setUser error:", e);
  }
}

export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("storage.getUser error:", e);
    return null;
  }
}

export async function removeUser() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (e) {
    console.warn("storage.removeUser error:", e);
  }
}

// ─── Clear all auth data ───
export async function clearAuth() {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
  } catch (e) {
    console.warn("storage.clearAuth error:", e);
  }
}
