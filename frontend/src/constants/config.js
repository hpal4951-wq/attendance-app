import { Platform } from "react-native";

// Change this to your PC's local IP for physical device testing
const PC_IP = "192.168.1.100";

// Android emulator uses 10.0.2.2 to reach localhost
// iOS simulator and web use localhost
// Physical device uses PC_IP on the same WiFi network
let API_BASE_URL;
if (Platform.OS === "android") {
  API_BASE_URL = `http://${PC_IP}:5000/api`;
} else {
  API_BASE_URL = "http://localhost:5000/api";
}

export { API_BASE_URL };

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
