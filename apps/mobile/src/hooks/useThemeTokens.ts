import { useColorScheme } from "@/components/useColorScheme";
import { getThemeTokens } from "@maak/core";
import { useMemo } from "react";

/**
 * Returns the correct MÄÄK token set (light/dark) for the current color scheme.
 * Drop-in replacement for importing `maakTokens` directly in components that
 * need to respect dark mode.
 */
export function useThemeTokens() {
  const colorScheme = useColorScheme();
  return useMemo(() => getThemeTokens(colorScheme), [colorScheme]);
}
