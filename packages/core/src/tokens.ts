/**
 * MÄÄK design tokens (hex) — speglar src/index.css / tailwind semantic colors.
 * Använd i Expo med StyleSheet; webben kan successivt importera samma värden.
 */
export const maakTokens = {
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

export type MaakTokens = typeof maakTokens;
