/**
 * MÄÄK Unified Design System – Design Tokens
 * Single source of truth for colors, typography, and mascot.
 * Aligned with MaakUnifiedDesignSystem (Eucalyptus Grove + Coral + Sage).
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 UNIFIED COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

export const COLORS = {
  /** PRIMARY: Forest Green – CTAs, trust, huvudåtgärder */
  primary: {
    50: "#F0F7F4",
    100: "#D9EDE4",
    200: "#B5DBC9",
    300: "#8AC4A9",
    400: "#5FA886",
    500: "#4B6E48",
    600: "#3D5A3B",
    700: "#2F472E",
    800: "#253D2C",
    900: "#1A2D1E",
  },

  /** ACCENT: Coral – Start Chat, notifikationer (MaakPolished) */
  coral: {
    50: "#FFF5F3",
    100: "#FFE8E4",
    200: "#FFD4CC",
    300: "#FFB3A6",
    400: "#FF8C7A",
    500: "#FF6B54",
    600: "#E84D35",
    700: "#C43D28",
    800: "#A63330",
    900: "#872928",
  },

  /** SECONDARY: Warm Sage – bakgrunder (MaakPolished lighter variants) */
  sage: {
    50: "#F8FAF9",
    100: "#EEF4F1",
    200: "#E1EBE6",
    300: "#CBDBD3",
    400: "#A8C4B8",
    500: "#87AD9D",
    600: "#968F6B",
    700: "#787254",
    800: "#5A5640",
    900: "#3D3B2C",
  },

  /** NEUTRALS (MaakPolished: cream, light, muted) */
  neutral: {
    white: "#FFFFFF",
    cream: "#FFFCF7",
    offWhite: "#FAFBFA",
    light: "#F5F6F5",
    muted: "#E8EBE9",
    sand: "#ECEAE5",
    stone: "#D4D1CA",
    gray: "#9CA3A0",
    slate: "#6B7370",
    charcoal: "#3D4543",
    dark: "#1E2422",
  },

  /** PERSONALITY ARCHETYPES */
  archetypes: {
    diplomat: { main: "#8B5CF6", light: "#EDE9FE", name: "Diplomaten", emoji: "🕊️" },
    strateg: { main: "#3B82F6", light: "#DBEAFE", name: "Strategen", emoji: "🎯" },
    byggare: { main: "#4B6E48", light: "#D9EDE4", name: "Byggaren", emoji: "🏗️" },
    upptackare: { main: "#F59E0B", light: "#FEF3C7", name: "Upptäckaren", emoji: "🧭" },
    debattoren: { main: "#0891B2", light: "#CFFAFE", name: "Debattören", emoji: "💡" },
    vardaren: { main: "#EC4899", light: "#FCE7F3", name: "Värdaren", emoji: "💝" },
  },
} as const;

export type ArchetypeKey = keyof typeof COLORS.archetypes;

// ═══════════════════════════════════════════════════════════════════════════════
// 🔤 TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════════

export const FONTS = {
  sans: '"DM Sans", system-ui, sans-serif',
  serif: '"Playfair Display", Georgia, serif',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🐉 MASCOT TOKENS (Single source of truth)
// ═══════════════════════════════════════════════════════════════════════════════

export const MASCOT_TOKENS = {
  home_idle: { token: "mascot_calm_idle", goal: "neutral", label: "Calm" },
  loading: { token: "mascot_waiting_tea", goal: "wait", label: "Loading" },
  empty_matches: { token: "mascot_planting_seed", goal: "reassure", label: "Empty Matches" },
  no_chats: { token: "mascot_practicing_mirror", goal: "reassure", label: "No Chats" },
  first_match: { token: "mascot_lighting_lantern", goal: "celebrate", label: "First Match" },
  ai_listening: { token: "mascot_ai_listening", goal: "listen", label: "Listening" },
  ai_thinking: { token: "mascot_ai_thinking", goal: "think", label: "Thinking" },
  ai_answering: { token: "mascot_ai_open_hand", goal: "explain", label: "Answering" },
  ai_celebrating: { token: "mascot_ai_tiny_sparkle", goal: "celebrate", label: "Celebrating" },
  teaching: { token: "mascot_teaching_book", goal: "teach", label: "Teaches" },
  reassuring: { token: "mascot_holding_warm_light", goal: "reassure", label: "Reassures" },
  explaining: { token: "mascot_presenting_ui_card", goal: "explain", label: "Explains" },
  waiting: { token: "mascot_waiting_tea", goal: "wait", label: "Waits" },
  celebrating_gently: { token: "mascot_lighting_lantern", goal: "celebrate", label: "Celebrates gently" },
  front: { token: "mascot_front", goal: "neutral", label: "Front" },
  sitting: { token: "mascot_sitting", goal: "neutral", label: "Sitting" },
  walking: { token: "mascot_walking", goal: "neutral", label: "Walking" },
  social: { token: "mascot_social", goal: "social", label: "Social" },
  calm: { token: "mascot_calm", goal: "reassure", label: "Calm" },
  encouraging: { token: "mascot_encouraging", goal: "reassure", label: "Encouraging" },
  offline: { token: "mascot_offline", goal: "wait", label: "Offline" },
  maak_intro: { token: "mascot_calm_idle", goal: "reassure", label: "MÄÄK Intro" },
} as const;

export type MascotStateKey = keyof typeof MASCOT_TOKENS;

export const MASCOT_LAYOUT = {
  hero: { size: "w-[220px]", placement: "center" },
  medium: { size: "w-[140px]", placement: "center" },
  icon: { size: "w-[32px]", placement: "inline" },
} as const;

/** Mascot image filenames by category (for composite sheets) */
export const MASCOT_IMAGES: Record<string, string> = {
  calm: "emotional_states.png",
  encouraging: "emotional_states.png",
  waiting: "emotional_states.png",
  social: "emotional_states.png",
  offline: "emotional_states.png",
  teaching: "usage_rules_light.png",
  reassuring: "usage_rules_light.png",
  explaining: "usage_rules_light.png",
  celebrating: "usage_rules_light.png",
  ai_listening: "ai_assistant_modes.png",
  ai_thinking: "ai_assistant_modes.png",
  ai_answering: "ai_assistant_modes.png",
  ai_celebrating: "ai_assistant_modes.png",
  empty_matches: "app_states.png",
  loading: "app_states.png",
  no_chats: "app_states.png",
  first_match: "app_states.png",
  front: "base_poses.png",
  sitting: "base_poses.png",
  walking: "base_poses.png",
};
