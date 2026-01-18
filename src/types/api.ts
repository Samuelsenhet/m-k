export interface DimensionScoreBreakdown {
  personality_similarity: number;
  archetype_alignment: number;
  interest_overlap: number;
}

// Icebreaker category types
export type IcebreakerCategory = 'funny' | 'deep' | 'activity' | 'compliment' | 'general';

export interface IcebreakerAnalytics {
  id: string;
  match_id: string;
  user_id: string;
  icebreaker_text: string;
  category: IcebreakerCategory | null;
  was_used: boolean;
  led_to_response: boolean | null;
  response_time_seconds: number | null;
  created_at: string;
}

export interface GenerateIcebreakersRequest {
  matchId: string;
  userArchetype?: string;
  matchedUserArchetype?: string;
  userName?: string;
  matchedUserName?: string;
  matchedUserId?: string;
  category?: IcebreakerCategory;
  userInterests?: string[];
  matchedUserInterests?: string[];
}

export interface GenerateIcebreakersResponse {
  icebreakers: string[];
  category?: IcebreakerCategory;
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
  category?: string;
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
  special_event_message?: string | null;
  photo_urls: string[];
  bio_preview: string;
  avatar_url?: string;
  common_interests: string[];
}
