/**
 * Design system — backwards-compatible aggregator.
 *
 * Canonical token values live in:
 *   src/constants/colors.js
 *   src/constants/sizes.js
 *
 * This module re-exports them so existing imports from `../theme`
 * keep working without change. Prefer importing from `../theme`
 * or directly from `../constants/colors` / `../constants/sizes`.
 */

export { COLORS } from "./constants/colors";
export {
  SPACING,
  FONT_SIZE,
  RADIUS,
  SHADOW,
  ICON_SIZE,
  BUTTON_HEIGHT,
  INPUT_HEIGHT,
} from "./constants/sizes";
