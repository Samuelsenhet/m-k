import { useColorScheme as useRNColorScheme } from "react-native";

/**
 * Keep API compatible with Expo/RN templates.
 * Returns `"light"` | `"dark"` (defaults to `"light"` for null/undefined).
 */
export function useColorScheme(): "light" | "dark" {
  const scheme = useRNColorScheme();
  return scheme === "dark" ? "dark" : "light";
}

