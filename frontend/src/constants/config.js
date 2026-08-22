import { Platform } from "react-native";

/**
 * ── API CONFIGURATION ─────────────────────────────────────────────
 *
 * Host selection:
 *   - Android emulator  → host machine is reached via 10.0.2.2
 *   - iOS simulator/web → localhost works directly
 *   - Physical device   → must use your PC's local network IP.
 *
 * To test on a physical device:
 *   1. Set USE_PC_IP to true
 *   2. Set PC_IP to your PC's LAN IP (run `ipconfig` on Windows /
 *      `ifconfig` on macOS/Linux to find it)
 *   3. Keep your phone on the same WiFi as your PC
 */
const PC_IP = "192.168.1.100";
const USE_PC_IP = false;
const API_PORT = 5000;

function resolveHost() {
  if (USE_PC_IP) return PC_IP;
  if (Platform.OS === "android") return "10.0.2.2";
  return "localhost";
}

export const API_BASE_URL = `http://${resolveHost()}:${API_PORT}/api`;

export const APP_NAME = "HostelConnect";
export const APP_TAGLINE = "Smart Hostel Attendance & Mess Management";
export const APP_VERSION = "1.0.0";

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
};

export const ROLES = {
  ADMIN: "admin",
  WARDEN: "warden",
  STUDENT: "student",
};
