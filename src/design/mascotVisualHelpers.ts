import { MASCOT_TOKENS, type MascotStateKey } from "./tokens";

/** Maps design system state key to asset token (e.g. for /mascot/{token}.png) */
export function getMascotTokenForDesignState(state: MascotStateKey): string {
  return MASCOT_TOKENS[state]?.token ?? "mascot_calm_idle";
}

/** Layout/size for mascot by state (hero for empty/first, medium for AI) */
export function getMascotLayout(state: MascotStateKey) {
  const key = String(state);
  if (key.startsWith("ai_")) return { size: "medium" as const, placement: "center" as const };
  if (key.includes("empty") || key.includes("first") || key.includes("no_chats"))
    return { size: "hero" as const, placement: "center" as const };
  return { size: "medium" as const, placement: "center" as const };
}

export const DARK_BG_STATES = new Set([
  "empty_matches",
  "loading",
  "no_chats",
  "first_match",
  "front",
  "sitting",
  "walking",
  "social",
  "calm",
  "encouraging",
  "waiting",
  "offline",
]);
