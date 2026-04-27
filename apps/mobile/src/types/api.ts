/** Subset of web src/types/api.ts for match-daily mapping */
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
}
