/**
 * Feature flags (A/B, onboarding, etc.). All opt-in via env.
 * Add new flags here and use in components. Default is false when unset.
 */

/** Enable A/B test variants (e.g. alternate copy or layouts). */
export const FEATURE_AB_TESTS =
  import.meta.env.VITE_FEATURE_AB_TESTS === "true";

/** Use onboarding v2 flow when true; otherwise current onboarding. */
export const FEATURE_ONBOARDING_V2 =
  import.meta.env.VITE_FEATURE_ONBOARDING_V2 === "true";

/**
 * Stable baseline mode: disables emotional system and mascot auto-sync.
 * When true, useMascot and useEmotionalState return neutral/base state only.
 * Set to false when re-enabling relationship depth, emotional surfaces, mascot sync.
 */
export const STABLE_MODE = true;
