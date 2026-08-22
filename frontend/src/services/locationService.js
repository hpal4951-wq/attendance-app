import * as Location from "expo-location";

/**
 * Normalizes the raw LocationObject from expo-location into
 * a plain { latitude, longitude, accuracy, isMocked, timestamp }.
 */
function normalize(position) {
  const coords = position?.coords || position || {};
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy ?? null,
    isMocked: !!coords.isFromMockProvider,
    timestamp: position?.timestamp || Date.now(),
  };
}

// ─── Check / request permission ─────────────────────────────

export async function checkLocationPermission() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status; // "granted" | "denied" | "undetermined"
  } catch {
    return "denied";
  }
}

export async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  } catch {
    return "denied";
  }
}

export async function checkLocationServices() {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

// ─── Single-shot location ───────────────────────────────────

export async function getCurrentLocation() {
  const services = await checkLocationServices();
  if (!services) {
    throw Object.assign(new Error("Location services are disabled"), { code: "SERVICES_DISABLED" });
  }

  const permission = await checkLocationPermission();
  if (permission !== "granted") {
    throw Object.assign(new Error("Location permission not granted"), { code: "PERMISSION_DENIED" });
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return normalize(position);
}

// ─── Continuous watch (for re-verification in future) ───────

export function watchLocation(onLocation, onError, options = {}) {
  let subscription;

  const start = async () => {
    try {
      const permission = await checkLocationPermission();
      if (permission !== "granted") {
        if (onError) onError(new Error("Location permission not granted"));
        return;
      }
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: options.timeInterval || 30000,
          distanceInterval: options.distanceInterval || 50,
        },
        (position) => {
          if (onLocation) onLocation(normalize(position));
        }
      );
    } catch (e) {
      if (onError) onError(e);
    }
  };

  start();

  return () => {
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
  };
}

const locationService = {
  checkLocationPermission,
  requestLocationPermission,
  checkLocationServices,
  getCurrentLocation,
  watchLocation,
};

export default locationService;