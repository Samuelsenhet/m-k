/** Subset of web src/types/api.ts for match-daily mapping */
export type MatchSubtype = "similar" | "complementary" | "growth";

/** Legacy per-dimension breakdown stored in matches.dimension_breakdown.
 *  Returned by match-daily in `dimension_score_breakdown`. The Monster Match
 *  v1 generator fills this from the LLM driving-dimensions but flattened to
 *  the legacy shape for backwards compat — the rich LLM-voice prose lives
 *  in match_story instead. */
export interface DimensionBreakdownEntry {
  dimension: string;
  score: number;
  alignment: "high" | "medium" | "low";
  description: string;
}

export interface MatchDailyMatch {
  match_id: string;
  profile_id: string;
  status?: "pending" | "mutual" | "passed" | "liked" | "disliked";
  display_name: string;
  age: number;
  archetype: string;
  category?: string;
  compatibility_percentage: number;
  personality_insight: string;
  match_reason: string;
  expires_at: string;
  special_effects?: string[] | null;
  special_event_message?: string | null;
  photo_urls: string[];
  bio_preview: string;
  avatar_url?: string;
  common_interests: string[];
  // --- Monster Match v1 ---
  match_story?: string | null;
  match_subtype?: MatchSubtype | null;
  validation_score?: number | null;
  validation_note?: string | null;
  fallback_used?: boolean | null;
  ai_icebreakers?: string[] | null;
  dimension_score_breakdown?: DimensionBreakdownEntry[] | null;
}
