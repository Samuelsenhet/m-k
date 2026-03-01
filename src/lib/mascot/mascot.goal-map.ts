/**
 * FAS – Mascot Goal Auto Sync
 * Single source: emotion → mascot goal. Never set goal manually in screens (except AI).
 */
import type { EmotionalState } from "@/lib/emotional-state";

export type MascotGoal =
  | "reassure"
  | "teach"
  | "explain"
  | "wait"
  | "celebrate"
  | "present";

export const EMOTION_TO_MASCOT_GOAL: Record<EmotionalState, MascotGoal> = {
  neutral: "present",
  hopeful: "wait",
  curious: "teach",
  warm: "celebrate",
  safe: "reassure",
  reflective: "teach",
};
