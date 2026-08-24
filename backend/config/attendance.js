import dotenv from "dotenv";

dotenv.config();

/**
 * Central attendance configuration.
 *
 * Every attendance-related tunable lives here (or in the environment) so the
 * same values are not scattered across controllers and utilities.
 */
export const ATTENDANCE_CONFIG = {
  // Application timezone — the authoritative timezone for attendance dates
  // and window checks. Intended for India (Asia/Kolkata).
  timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",

  // Daily attendance verification window (HH:mm, 24-hour, in APP_TIMEZONE).
  // The default of 00:00–23:59 keeps the window always open; admins should
  // narrow it (e.g. 06:00–10:00) for real deployments.
  windowStart: process.env.ATTENDANCE_WINDOW_START || "00:00",
  windowEnd: process.env.ATTENDANCE_WINDOW_END || "23:59",

  // Maximum acceptable GPS accuracy in meters. Fixes reporting worse accuracy
  // than this are NOT trusted to mark attendance.
  maxAcceptableAccuracy: Number(process.env.MAX_ACCEPTABLE_ACCURACY) || 100,

  // Default attendance radius when a hostel has no explicit radius (meters).
  defaultRadiusMeters: Number(process.env.ATTENDANCE_DEFAULT_RADIUS) || 120,

  // Optional safety buffer (meters). The decision rule remains:
  //   distance <= radius            → PRESENT
  //   distance >  radius            → OUTSIDE
  // The buffer is informational (for display) and does not change the rule.
  bufferMeters: Number(process.env.ATTENDANCE_BUFFER_METERS) || 0,

  // Rate limiting for the location verification endpoint.
  rateLimit: {
    windowMs: Number(process.env.ATTENDANCE_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    max: Number(process.env.ATTENDANCE_RATE_LIMIT_MAX) || 30,
  },
};
