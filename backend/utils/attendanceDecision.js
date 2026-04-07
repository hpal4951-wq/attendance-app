export function decideAttendance({
  distance,
  radiusMeters,
  accuracy,
  isMocked = false,
}) {
  if (isMocked) {
    return {
      status: "pending",
      reason: "Mock location suspected",
    };
  }

  if (accuracy && accuracy > 150) {
    return {
      status: "pending",
      reason: "Location accuracy too low",
    };
  }

  if (distance <= radiusMeters && (!accuracy || accuracy <= 80)) {
    return {
      status: "present",
      reason: "Inside hostel radius with valid accuracy",
    };
  }

  if (distance <= radiusMeters && accuracy > 80) {
    return {
      status: "pending",
      reason: "Inside radius but accuracy is weak",
    };
  }

  return {
    status: "absent",
    reason: "Outside hostel radius",
  };
}