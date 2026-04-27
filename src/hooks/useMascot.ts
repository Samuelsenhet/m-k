import { STABLE_MODE } from "@/config/features";
import {
  getMascotTokenForState,
  getMascotLayoutForState,
  getMascotAnimationForState,
  type MascotToken,
  type MascotSize,
  type MascotAnimationType,
  type MascotPlacement,
  type MascotSpacingPreset,
} from "@/lib/mascot";
import { resolveMascotGoal } from "@/lib/mascot/resolveMascotGoal";
import type { MascotGoal } from "@/lib/mascot/mascot.goal-map";
import { getEmotionalState } from "@/lib/emotional-state";
import type { EmotionalConfig } from "@/lib/emotional-state";

export interface MascotState {
  token: MascotToken;
  size: MascotSize;
  placement: MascotPlacement;
  animation: MascotAnimationType;
  spacingPreset: MascotSpacingPreset;
  /** FAS Mascot Goal Auto Sync: derived from emotion when emotionalConfig is passed; never set manually (except AI). */
  mascotGoal?: MascotGoal;
  /** FAS Presence: when emotionalConfig provided, true only when emotion !== "neutral"; otherwise true (always show). */
  shouldShow: boolean;
}

export interface UseMascotOptions {
  /** When provided, mascotGoal is derived from emotional state (emotion → goal). */
  emotionalConfig?: EmotionalConfig;
}

/** Returns token + size + placement + animation + spacingPreset (+ mascotGoal when emotionalConfig provided). */
export function useMascot(screenState: string, options?: UseMascotOptions): MascotState {
  const layout = getMascotLayoutForState(screenState);

  if (STABLE_MODE) {
    return {
      token: getMascotTokenForState(screenState),
      size: layout.size,
      placement: layout.placement,
      animation: getMascotAnimationForState(screenState),
      spacingPreset: layout.spacingPreset,
      mascotGoal: "reassure",
      shouldShow: true,
    };
  }

  const emotion = options?.emotionalConfig ? getEmotionalState(options.emotionalConfig) : null;
  const autoGoal = resolveMascotGoal(emotion ?? undefined);
  const shouldShow = emotion === null ? true : emotion !== "neutral";

  return {
    token: getMascotTokenForState(screenState),
    size: layout.size,
    placement: layout.placement,
    animation: getMascotAnimationForState(screenState),
    spacingPreset: layout.spacingPreset,
    mascotGoal: autoGoal,
    shouldShow,
  };
}
