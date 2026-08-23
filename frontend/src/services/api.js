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

const MAX_RETRIES = 2;

// Retry only network failures (connection issues) and transient 5xx for GET.
// Never retry 401/403/400/409. Never blindly retry POST bodies (duplicates).
async function request(endpoint, method = "GET", body = null) {
  const headers = await getAuthHeaders();
  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      return await handleResponse(response);
    } catch (error) {
      // HTTP errors (4xx/5xx) already thrown by handleResponse as Error with .status
      if (error.status) {
        const retryable = error.status >= 500 && method === "GET" && attempt < MAX_RETRIES;
        if (!retryable) throw error;
        attempt += 1;
        await delay(300 * attempt);
        continue;
      }

      // Network failures — retry a limited number of times for idempotent methods
      const isNetworkError = error.message === "Network request failed" || error.name === "TypeError";
      if (isNetworkError && attempt < MAX_RETRIES) {
        attempt += 1;
        await delay(400 * attempt);
        continue;
      }

      if (isNetworkError) {
        const networkError = new Error(
          "Unable to connect to server. Please check your internet connection."
        );
        networkError.isNetwork = true;
        throw networkError;
      }
      throw error;
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export async function apiDelete(endpoint, body = null) {
  return request(endpoint, "DELETE", body);
}
