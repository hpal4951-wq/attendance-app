/**
 * Maps thrown API errors to user-friendly messages.
 * The api.js client throws Error objects with `.status`, `.isNetwork`
 * and `.message` — screens should never render raw error objects.
 */
export function getErrorMessage(
  err,
  fallback = "Something went wrong. Please try again."
) {
  if (!err) return fallback;

  if (err.isNetwork) {
    return "Unable to connect to server. Please check your internet connection.";
  }

  const code = err?.data?.code;
  if (code) {
    const codeMessages = {
      ATTENDANCE_WINDOW_CLOSED:
        "Attendance verification is currently closed. Please try again during the attendance window.",
      LOCATION_ACCURACY_LOW:
        "Location accuracy is too low. Please move to an open area and try again.",
      LOCATION_UNAVAILABLE:
        "Unable to get your location. Please try again.",
      LOCATION_DISABLED:
        "Please turn on Location Services to verify attendance.",
      LOCATION_PERMISSION_REQUIRED:
        "Location permission is required for automatic attendance.",
      LOCATION_SUSPECTED:
        "Location could not be verified. Please try again in a moment.",
      HOSTEL_NOT_ASSIGNED: "No hostel is assigned to this student.",
      HOSTEL_LOCATION_NOT_CONFIGURED:
        "Hostel attendance location is not configured. Please contact the admin.",
      INVALID_COORDINATES: "Invalid coordinates received from the device.",
      INVALID_STATUS: "Invalid attendance status provided.",
      STUDENT_PROFILE_NOT_FOUND: "Student profile not found.",
      ALREADY_RECORDED: "Attendance has already been recorded.",
      SERVER_ERROR: "Something went wrong on the server. Please try again later.",
      UNAUTHORIZED: "You are not authorized to perform this action.",
      RATE_LIMITED: "Too many verification attempts. Please wait a moment and try again.",
    };
    if (codeMessages[code]) return codeMessages[code];
  }

  switch (err.status) {
    case 401:
      return "Your session has expired. Please login again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 500:
      return "Something went wrong on the server.";
    default:
      break;
  }

  // 400 and other statuses carry a backend validation message
  if (typeof err.message === "string" && err.message.length > 0) {
    return err.message;
  }

  return fallback;
}
