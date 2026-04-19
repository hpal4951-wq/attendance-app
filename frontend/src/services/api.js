import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.25.218:5000/api"; 
// emulator ke liye 10.0.2.2
// physical device ke liye apne PC ka local IP use karo
// e.g. http://192.168.1.10:5000/api

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

export async function apiGet(endpoint) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
  });

  return response.json();
}

export async function apiPost(endpoint, body) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function apiPatch(endpoint, body) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });

  return response.json();
}