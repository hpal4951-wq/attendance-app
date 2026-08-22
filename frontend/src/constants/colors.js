/**
 * Design system — color tokens.
 *
 * Canonical source of truth for every color used in the app.
 * Screens and components must import from here (or from `../theme`,
 * which re-exports these tokens) instead of hardcoding hex values.
 */

export const COLORS = {
  // Brand
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primaryLight: "#dbeafe",
  secondary: "#6366f1",

  // Semantic
  success: "#16a34a",
  successLight: "#dcfce7",
  danger: "#dc2626",
  dangerLight: "#fee2e2",
  warning: "#d97706",
  warningLight: "#fef3c7",
  info: "#0284c7",
  infoLight: "#e0f2fe",
  error: "#dc2626",

  // Surfaces
  background: "#f1f5f9",
  surface: "#ffffff",
  card: "#ffffff",
  bg: "#f1f5f9",
  border: "#e2e8f0",

  // Text
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",

  white: "#ffffff",
  black: "#000000",
};
