import { ATTENDANCE_CONFIG } from "../config/attendance.js";

const TIMEZONE = ATTENDANCE_CONFIG.timezone;

// Builds a { type: value } map from Intl.DateTimeFormat parts for the
// configured application timezone. Never relies on the server's local zone.
function partsInTimezone(now, options) {
  const map = {};
  new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, ...options })
    .formatToParts(now)
    .forEach((p) => {
      if (p.type !== "literal") map[p.type] = p.value;
    });
  return map;
}

// "2026-08-24" in the application timezone.
export function getTodayDateString() {
  const p = partsInTimezone(new Date(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${p.year}-${p.month}-${p.day}`;
}

// "HH:mm" (24-hour) in the application timezone. Intl can emit "24" for hour
// midnight edge cases, so normalize to "00".
export function getCurrentTimeHHMM() {
  const p = partsInTimezone(new Date(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const hh = p.hour === "24" ? "00" : p.hour;
  return `${hh}:${p.minute}`;
}

// Current hour (0-23) in the application timezone.
export function getCurrentHour() {
  const p = partsInTimezone(new Date(), {
    hour: "2-digit",
    hour12: false,
  });
  return p.hour === "24" ? 0 : Number(p.hour);
}

// True when current (HH:mm) is within the inclusive [start, end] range.
export function isTimeInRange(current, start, end) {
  return current >= start && current <= end;
}

export function isWithinWindow(current, start, end) {
  return isTimeInRange(current, start, end);
}

// Fallback slot label when no configured window matches.
export function defaultSlotByTime() {
  return getCurrentHour() < 12 ? "morning" : "night";
}

export function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
