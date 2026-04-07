/**
 * MÄÄK design tokens (hex) — speglar src/index.css / tailwind semantic colors.
 * Använd i Expo med StyleSheet; webben kan successivt importera samma värden.
 */

/** Shared spacing / radius values (identical across themes). */
const layout = {
  radiusSm: 4,
  radiusMd: 8,
  radiusLg: 12,
  radiusXl: 16,
  radius2xl: 24,
  radius3xl: 28,
  /** Ungefärlig max innehållsbredd (Tailwind max-w-2xl ≈ 42rem) */
  contentMaxWidth: 448,
  screenPaddingHorizontal: 16,
  screenPaddingTop: 24,
  tabBarPaddingBottom: 24,
} as const;

/** Light theme colors (default). */
const lightColors = {
  background: "#F2F0EF",
  foreground: "#253D2C",
  card: "#FAF9F8",
  muted: "#EBEAE8",
  mutedForeground: "#6B6B6B",
  primary: "#4B6E48",
  primaryMid: "#5FA886",
  primaryForeground: "#FFFFFF",
  border: "#E8E4E0",
  destructive: "#D92D20",
  coral: "#F97068",
  sage: "#B2AC88",
  cream: "#F5F4F1",
  /** Knappgradient (start → end) */
  gradientPrimary: ["#4B6E48", "#5FA886"] as const,
} as const;

/** Dark theme colors. */
const darkColors = {
  background: "#1C1C1E",
  foreground: "#F5F4F1",
  card: "#2C2C2E",
  muted: "#3A3A3C",
  mutedForeground: "#A0A0A0",
  primary: "#5FA886",
  primaryMid: "#4B6E48",
  primaryForeground: "#FFFFFF",
  border: "#3A3A3C",
  destructive: "#FF6B6B",
  coral: "#FF8A82",
  sage: "#C4BF9A",
  cream: "#2C2C2E",
  /** Knappgradient (start → end) */
  gradientPrimary: ["#5FA886", "#4B6E48"] as const,
} as const;

/** Light tokens (backward-compatible default export). */
export const maakTokens = { ...lightColors, ...layout } as const;

/** Dark tokens. */
export const maakTokensDark = { ...darkColors, ...layout } as const;

export type MaakTokens = {
  [K in keyof typeof maakTokens]: (typeof maakTokens)[K] extends readonly (infer _)[]
    ? readonly string[]
    : (typeof maakTokens)[K] extends number
      ? number
      : string;
};

/** Return the correct token set for the given color scheme. */
export function getThemeTokens(colorScheme: "light" | "dark" | null | undefined): MaakTokens {
  return colorScheme === "dark" ? maakTokensDark : maakTokens;
}
