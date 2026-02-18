/**
 * Mascot asset system – aligned with MaakUnifiedDesignSystem_1.jsx.
 *
 * När och var mascoten ska visas (single source of truth):
 * - Visas ENDAST när den: lär ut, lugnar, förklarar, väntar, firar varsamt.
 * - Aldrig som dekoration. Aldrig hyperaktiv.
 *
 * Var i appen:
 * - empty_matches  → Matches (inga matchningar)   → planting_seed, hero, center
 * - no_chats       → Chat (inga chattar)          → practicing_mirror, hero, center
 * - first_match    → Första match-firande         → lighting_lantern, hero, center
 * - waiting_phase  → Väntfas                      → waiting_tea, medium, center
 * - landing_hero   → Landing (hero)               → ai_open_hand, hero, center
 * - landing_problem→ Landing (problem)            → ai_thinking, medium, center
 * - profile_empty  → Profil tom                   → practicing_mirror, medium, center
 * - samlingar_empty→ Samlingar tom                → planting_seed, medium, center
 * - home_idle      → Logo / hem                   → calm_idle, icon, inline
 *
 * Storlek (MASCOT_LAYOUT): hero = empty states/onboarding, medium = AI/sekundär, icon = logo/badges.
 */
export const MASCOT_USAGE_RULES =
  "Visas ENDAST när: lär ut, lugnar, förklarar, väntar, firar varsamt. Aldrig dekoration, aldrig hyperaktiv.";

export const MASCOT_ASSET_NAMES = [
  "mascot_ai_listening",
  "mascot_ai_open_hand",
  "mascot_ai_thinking",
  "mascot_ai_tiny_sparkle",
  "mascot_calm_idle",
  "mascot_lighting_lantern",
  "mascot_planting_seed",
  "mascot_practicing_mirror",
  "mascot_waiting_tea",
] as const;

export type MascotToken = (typeof MASCOT_ASSET_NAMES)[number];

/** Composite/sprite sheet: one image, multiple poses in a row. */
export interface MascotCompositeConfig {
  /** Filename in /mascot/ (e.g. "mascot_sheet_ai.png"). */
  sheet: string;
  /** Number of poses in a row (e.g. 4). */
  columns: number;
  /** 0-based index of the pose to show (0..columns-1). */
  index: number;
}

/**
 * Optional: tokens that use a composite sheet instead of a single PNG.
 * If a token is listed here, Mascot will render a slice of the sheet; otherwise it uses /mascot/{token}.png.
 * Sheet built with: node scripts/build-mascot-sprite.mjs
 */
export const MASCOT_COMPOSITE_MAP: Partial<Record<MascotToken, MascotCompositeConfig>> = {
  mascot_ai_listening: { sheet: "mascot_sheet_ai.png", columns: 4, index: 0 },
  mascot_ai_thinking: { sheet: "mascot_sheet_ai.png", columns: 4, index: 1 },
  mascot_ai_open_hand: { sheet: "mascot_sheet_ai.png", columns: 4, index: 2 },
  mascot_ai_tiny_sparkle: { sheet: "mascot_sheet_ai.png", columns: 4, index: 3 },
};

export type MascotAsset =
  | { type: "single"; src: string }
  | { type: "composite"; sheet: string; columns: number; index: number };

export function getMascotAsset(token: MascotToken): MascotAsset {
  const composite = MASCOT_COMPOSITE_MAP[token];
  if (composite) {
    return {
      type: "composite",
      sheet: composite.sheet,
      columns: composite.columns,
      index: composite.index,
    };
  }
  return { type: "single", src: `/mascot/${token}.png` };
}

export const MASCOT_SCREEN_STATES = {
  WAITING: "waiting_phase",
  FIRST_MATCH: "first_match",
  EMPTY_MATCHES: "empty_matches",
  HOME_IDLE: "home_idle",
  PROFILE_EMPTY: "profile_empty",
  LANDING_HERO: "landing_hero",
  LANDING_PROBLEM: "landing_problem",
  NO_CHATS: "no_chats",
  SAMLINGAR_EMPTY: "samlingar_empty",
  /** First identity intro (Landing hero). Token: calm_idle, goal: reassure. */
  MAAK_INTRO: "maak_intro",
  /** Onboarding welcome – Määk as guide. Token: calm_idle, goal: guide. */
  ONBOARDING_WELCOME: "onboarding_welcome",
} as const;

export type MascotScreenState = (typeof MASCOT_SCREEN_STATES)[keyof typeof MASCOT_SCREEN_STATES];

/** Design system token map (MaakUnifiedDesignSystem_1.jsx). */
const STATE_TOKEN_MAP: Record<string, MascotToken> = {
  first_match: "mascot_lighting_lantern",
  empty_matches: "mascot_planting_seed",
  samlingar_empty: "mascot_planting_seed",
  home_idle: "mascot_calm_idle",
  profile_empty: "mascot_practicing_mirror",
  landing_hero: "mascot_ai_open_hand",
  landing_problem: "mascot_ai_thinking",
  no_chats: "mascot_practicing_mirror",
  waiting_phase: "mascot_waiting_tea",
  maak_intro: "mascot_calm_idle", // first identity intro; goal: reassure
  onboarding_welcome: "mascot_calm_idle", // guide through onboarding; goal: guide
};

/** Design system layout: hero = empty/onboarding, medium = AI/sekundär, icon = logo. */
export type MascotSize = "small" | "medium" | "hero" | "icon";

export function getMascotTokenForState(state: string): MascotToken {
  return STATE_TOKEN_MAP[state] ?? "mascot_calm_idle";
}

/** Return size + placement for a screen state (design system MASCOT_LAYOUT). */
export function getMascotLayoutForState(state: string): {
  size: MascotSize;
  placement: "center" | "inline";
} {
  if (state === "home_idle") return { size: "icon", placement: "inline" };
  if (
    state === "empty_matches" ||
    state === "no_chats" ||
    state === "first_match" ||
    state === "landing_hero" ||
    state === "maak_intro" ||
    state === "onboarding_welcome"
  )
    return { size: "hero", placement: "center" };
  if (state?.startsWith("ai_")) return { size: "medium", placement: "center" };
  return { size: "medium", placement: "center" };
}
