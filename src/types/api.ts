export interface DimensionScoreBreakdown {
  personality_similarity: number;
  archetype_alignment: number;
  interest_overlap: number;
}
// Types for API contracts (Edge Functions)

export interface MatchDailyRequest {
  user_id: string;
  page_size?: number;
  cursor?: string;
}

export interface MatchDailyResponse {
  date: string;
  batch_size: number;
  user_limit: number | null;
  matches: MatchDailyMatch[];
  special_event_message?: string | null;
  next_cursor?: string | null;
}

export interface MatchDailyMatch {
  match_id: string;
  profile_id: string;
  display_name: string;
  age: number;
  archetype: string;
  compatibility_percentage: number;
  dimension_score_breakdown: DimensionScoreBreakdown[];
  archetype_alignment_score: number;
  conversation_anxiety_reduction_score: number;
  ai_icebreakers: string[];
  personality_insight: string;
  match_reason: string;
  is_first_day_match: boolean;
  expires_at: string;
  special_effects?: string[] | null;
  photo_urls: string[];
  bio_preview: string;
  common_interests: string[];
}
