/**
 * FAS – Mascot Goal Auto Sync
 * Resolves mascot goal from emotional state. Synchronous, no network.
 */
import { EMOTION_TO_MASCOT_GOAL } from "./mascot.goal-map";
import type { EmotionalState } from "@/lib/emotional-state";
import type { MascotGoal } from "./mascot.goal-map";

export function resolveMascotGoal(emotion?: EmotionalState | null): MascotGoal | undefined {
  if (emotion == null) return undefined;
  return EMOTION_TO_MASCOT_GOAL[emotion];
}
