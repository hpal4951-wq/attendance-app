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
