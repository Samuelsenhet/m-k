/**
 * FAS – Emotional System
 * UI-state layer: tone, micro-surface, mascot goal. No layout, routing, or logic change.
 * Works on top of relationship depth.
 */

export type EmotionalState =
  | "neutral"
  | "hopeful"
  | "curious"
  | "warm"
  | "safe"
  | "reflective";

export const EMOTIONAL_SURFACE: Record<EmotionalState, string> = {
  neutral: "",
  hopeful: "bg-[hsl(var(--relationship-glow-calm))]",
  curious: "bg-muted/40",
  warm: "bg-primary/5",
  safe: "bg-background",
  reflective: "bg-muted/30",
};

export type MascotGoal = "reassure" | "explain" | "celebrate" | "teach";

export const EMOTIONAL_MASCOT_GOAL: Record<EmotionalState, MascotGoal> = {
  neutral: "reassure",
  hopeful: "reassure",
  curious: "explain",
  warm: "celebrate",
  safe: "reassure",
  reflective: "teach",
};

export interface EmotionalConfig {
  screen: "waiting" | "matches" | "chat" | "profile";
  hasMatches?: boolean;
  relationshipLevel?: number | null;
  hasMessages?: boolean;
}

/**
 * Resolves emotional state from screen + context. No new state or backend.
 */
export function getEmotionalState(config: EmotionalConfig): EmotionalState {
  const { screen, hasMatches, relationshipLevel, hasMessages } = config;
  if (screen === "waiting") return "hopeful";
  if (screen === "matches" && hasMatches) return "curious";
  if (screen === "chat" && (relationshipLevel ?? 0) >= 3) return "warm";
  if (screen === "chat" && !hasMessages) return "safe";
  if (screen === "profile") return "reflective";
  return "neutral";
}

export function getEmotionalSurfaceClass(state: EmotionalState): string {
  return EMOTIONAL_SURFACE[state] ?? "";
}

export function getEmotionalMascotGoal(state: EmotionalState): MascotGoal {
  return EMOTIONAL_MASCOT_GOAL[state] ?? "reassure";
}
