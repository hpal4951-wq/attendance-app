/**
 * Request validation middleware.
 *
 * Keeps malformed payloads from reaching controller logic. Rejects NaN,
 * Infinity, null/undefined coordinates, and malformed strings with a clear
 * 400 + INVALID_COORDINATES response.
 */
const fail = (res, message) =>
  res.status(400).json({
    success: false,
    code: "INVALID_COORDINATES",
    message,
  });

export const validateCoordinates = (req, res, next) => {
  const { latitude, longitude, accuracy } = req.body;

  if (
    latitude === undefined ||
    latitude === null ||
    longitude === undefined ||
    longitude === null
  ) {
    return fail(res, "latitude and longitude are required");
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return fail(res, "Invalid coordinates provided");
  }

  if (accuracy !== undefined && accuracy !== null) {
    const acc = Number(accuracy);
    if (!Number.isFinite(acc) || acc < 0) {
      return fail(res, "Accuracy must be a non-negative number");
    }
    req.body.accuracy = acc;
  }

  // Normalize so the controller always works with real numbers.
  req.body.latitude = lat;
  req.body.longitude = lng;

  next();
};

export const validateReview = (req, res, next) => {
  const { status } = req.body;
  if (!["present", "absent", "pending"].includes(status)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_STATUS",
      message: "Status must be present, absent or pending",
    });
  }
  next();
};
