import { useMemo } from "react";
import { STABLE_MODE } from "@/config/features";
import {
  getEmotionalState,
  getEmotionalSurfaceClass,
  getEmotionalMascotGoal,
  type EmotionalConfig,
  type EmotionalState,
  type MascotGoal,
} from "@/lib/emotional-state/emotionalState.config";

export interface UseEmotionalStateResult {
  emotionalState: EmotionalState;
  surfaceClass: string;
  mascotGoal: MascotGoal;
}

/**
 * FAS – Emotional System hook.
 * Returns emotional state, surface class for wrappers, and mascot goal. No layout or logic change.
 */
export function useEmotionalState(config: EmotionalConfig): UseEmotionalStateResult {
  const neutralResult = useMemo<UseEmotionalStateResult>(
    () => ({
      emotionalState: "neutral" as EmotionalState,
      surfaceClass: "",
      mascotGoal: "reassure" as MascotGoal,
    }),
    [],
  );

  const computedResult = useMemo(() => {
    const state = getEmotionalState(config);
    return {
      emotionalState: state,
      surfaceClass: getEmotionalSurfaceClass(state),
      mascotGoal: getEmotionalMascotGoal(state),
    };
  }, [config]);

  if (STABLE_MODE) {
    return neutralResult;
  }
  return computedResult;
}
