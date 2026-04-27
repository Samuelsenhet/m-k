/**
 * Shared types for the Monster Match v1 algorithm.
 *
 * Layer 2 (math) produces a `MatchPayload` per candidate.
 * Layer 4 (LLM) consumes it via `MatchContext` and returns a `MatchPayloadOutput`.
 * The merged result is what `match-daily` surfaces to the iOS client.
 */

import type { ArchetypeCode, DimensionKey } from "./personality.js";

export type MatchSubtype = "similar" | "complementary" | "growth";

export type MatchPairLabel =
  | "golden complementary"
  | "high compatibility"
  | "moderate"
  | "mirror"
  | "friction"
  | "clash";

export type DimensionAlignment = "similar" | "complementary";

export type DimensionImpact = "high" | "medium" | "low";

/** Per-dimension analysis attached to each candidate. */
export type DrivingDimension = {
  dim: DimensionKey;
  their: number; // 0–100
  your: number; // 0–100
  alignment: DimensionAlignment;
  impact: DimensionImpact;
};

/** Archetype-pair lookup result from the 16×16 matrix. */
export type ArchetypePair = {
  their: ArchetypeCode;
  yours: ArchetypeCode;
  pair_score: number; // 0–100, from ARCHETYPE_PAIR_SCORES
  label: MatchPairLabel;
};

/** Component scores that sum (weighted) into the final compatibility score. */
export type SignalBreakdown = {
  personality: number; // 0–100
  archetype_pair: number; // 0–100
  interests: number; // 0–100
  geo: number; // 0–100
  complementary_bonus: number; // 0 or 100
  // Synthesis layer (Monster Match v1 refit). Both null when MONSTER_MATCH_ENABLED
  // is off OR when user_signals/LLM are unavailable for this pair, in which case
  // computeCompositeScore falls back to the original formula.
  embedding_similarity?: number | null; // 0–100, cosine-derived
  llm_judgment?: number | null; // 0–100, validation_score from generateMatchPayload
};

/**
 * Layer 2 output → consumed by Layer 4 (LLM) and shipped to the client.
 * "Already-interpreted analysis" — not raw dimension scores.
 */
export type MatchPayload = {
  user_id: string;
  raw_score: number; // final compatibility score 0–100
  match_subtype: MatchSubtype;
  driving_dimensions: DrivingDimension[];
  archetype_pair: ArchetypePair;
  signal_breakdown: SignalBreakdown;
  shared_interests: string[];
  notable_facts: string[]; // "båda 28 år", "bor 4 km bort", ...
};

/** Input to the LLM wrapper — the full picture for one (user, candidate) pair. */
export type MatchContext = {
  payload: MatchPayload;
  viewer_archetype: ArchetypeCode;
  viewer_display_name: string;
  candidate_display_name: string;
  candidate_bio: string | null;
  locale: "sv" | "en";
};

/** What Claude (or fallback) returns for one match. */
export type MatchPayloadOutput = {
  story: string; // 1–2 sentences "varför just ni"
  dimension_breakdown: Array<{
    dim: DimensionKey;
    text: string;
  }>;
  icebreakers: [string, string, string];
  validation_score: number; // 0–100, LLM's own opinion
  validation_note: string; // 1 sentence motivation
};

/** Combined record persisted into matches / user_daily_match_pools. */
export type MatchRecord = MatchPayload & MatchPayloadOutput & {
  fallback_used: boolean;
};

/** Threshold beyond which the LLM and math are deemed in disagreement. */
export const VALIDATION_DIVERGENCE_THRESHOLD = 25;

/** Default classification threshold (per-dimension distance, 0–100). */
export const DIMENSION_FRICTION_THRESHOLD = 30;

/** Target distribution of match subtypes per daily batch. */
export const SUBTYPE_TARGET_RATIOS: Record<MatchSubtype, number> = {
  similar: 0.5,
  complementary: 0.35,
  growth: 0.15,
};
