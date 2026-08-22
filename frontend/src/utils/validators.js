/**
 * Validate Indian phone number (10 digits, starting with 6-9).
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\s|-/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validate password — minimum 6 characters.
 */
export function isValidPassword(password) {
  if (!password) return false;
  return password.length >= 6;
}

/**
 * Format phone number for display: +91 XXXXX XXXXX
 */
export function formatPhone(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\s|-/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return cleaned;
}
