import { API_BASE_URL } from "../constants/config";
import { getToken } from "../utils/storage";

const BASE_URL = API_BASE_URL;

async function getAuthHeaders() {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Server error (${response.status}): Unable to parse response`
    );
  }

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function request(endpoint, method = "GET", body = null) {
  const headers = await getAuthHeaders();
  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    return await handleResponse(response);
  } catch (error) {
    // Network errors
    if (error.message === "Network request failed" || error.name === "TypeError") {
      const networkError = new Error(
        "Unable to connect to server. Please check your internet connection."
      );
      networkError.isNetwork = true;
      throw networkError;
    }
    throw error;
  }
}

export async function apiGet(endpoint) {
  return request(endpoint, "GET");
}

export async function apiPost(endpoint, body) {
  return request(endpoint, "POST", body);
}

export async function apiPut(endpoint, body) {
  return request(endpoint, "PUT", body);
}

export async function apiPatch(endpoint, body) {
  return request(endpoint, "PATCH", body);
}

export async function apiDelete(endpoint) {
  return request(endpoint, "DELETE");
}
