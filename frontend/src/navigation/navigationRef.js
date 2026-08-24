import { createNavigationContainerRef } from "@react-navigation/native";

/**
 * Global navigation ref so notification taps (and other non-component code)
 * can navigate to the correct screen without a second navigation system.
 */
export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
