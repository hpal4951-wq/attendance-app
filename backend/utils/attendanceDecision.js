export function decideAttendance({
  distance,
  radiusMeters,
  accuracy,
  isMocked = false,
  maxAccuracy = 100,
}) {
  if (isMocked) {
    return {
      status: "pending",
      reason: "Mock location suspected",
    };
  }

  if (accuracy && accuracy > maxAccuracy) {
    return {
      status: "pending",
      reason: "Location accuracy too low",
    };
  }

  if (distance <= radiusMeters) {
    return {
      status: "present",
      reason: "Inside hostel attendance radius",
    };
  }

  return {
    status: "absent",
    reason: "Outside hostel attendance radius",
  };
}
