/**
 * TypeScript interfaces for the batch matching system
 * Matches the JSON structure used in user_daily_match_pool.pool_data
 */

export interface DimensionScore {
  O: number; // Openness
  C: number; // Conscientiousness
  E: number; // Extraversion
  A: number; // Agreeableness
  N: number; // Neuroticism
}

export interface DimensionScoreBreakdown {
  personality_similarity: number; // 0-40 points (40% weight)
  archetype_alignment: number;    // 0-30 points (30% weight)
  interest_overlap: number;       // 0-30 points (30% weight)
}

export interface AgeIntervalMatch {
  user_min: number;
  user_max: number;
  candidate_age: number;
  is_match: boolean;
}

export interface CandidateInPool {
  user_id: string;
  match_type: 'similar' | 'complementary';
  composite_score: number; // 0-100 (total score)
  similarity_score: number; // For similar matches
  complementary_score: number; // For complementary matches
  dimension_scores: DimensionScoreBreakdown;
  
  // Profile data for display/delivery
  display_name: string;
  archetype: string;
  interests: string[];
  age: number;
  location: string;
  
  // Dealbreaker validation
  age_interval_match: AgeIntervalMatch;
  
  // Icebreakers (3 per candidate)
  ai_icebreakers: string[];
}

export interface DeliveryRules {
  is_plus: boolean;
  user_limit: number | null; // 5 for free, null for plus
  actual_delivery_count: number; // Actual count to deliver today
}

export interface UserDailyMatchPool {
  user_id: string;
  date: string; // 'YYYY-MM-DD' in CET timezone
  batch_id: string;
  pool_data: {
    candidates: CandidateInPool[];
    generation_meta: {
      total_eligible: number;
      requested_batch_size: number;
      actual_batch_size: number; // Capped to total_eligible
      similar_count: number; // 60% of actual_batch_size
      complementary_count: number; // 40% of actual_batch_size
      repeat_prevention_applied: boolean;
      fresh_candidates_count: number;
      fallback_used: boolean; // True if fresh < 1
    };
    delivery_rules: DeliveryRules;
  };
  expires_at: string; // ISO timestamp for cleanup job
  created_at: string;
}

/**
 * Example JSON structure for reference:
 * 
 * {
 *   "candidates": [
 *     {
 *       "user_id": "uuid-123",
 *       "match_type": "similar",
 *       "composite_score": 85,
 *       "similarity_score": 78,
 *       "complementary_score": 0,
 *       "dimension_scores": {
 *         "personality_similarity": 35,
 *         "archetype_alignment": 25,
 *         "interest_overlap": 25
 *       },
 *       "display_name": "Anna",
 *       "archetype": "Upptäcktsresande",
 *       "interests": ["Matlagning", "Yoga", "Resor"],
 *       "age": 28,
 *       "location": "Stockholm",
 *       "age_interval_match": {
 *         "user_min": 25,
 *         "user_max": 35,
 *         "candidate_age": 28,
 *         "is_match": true
 *       },
 *       "ai_icebreakers": [
 *         "Vad är det bästa receptet du lagat nyligen?",
 *         "Vilken är din drömresa nästa år?",
 *         "Vilken yoga-stil föredrar du?"
 *       ]
 *     }
 *   ],
 *   "generation_meta": {
 *     "total_eligible": 45,
 *     "requested_batch_size": 10,
 *     "actual_batch_size": 10,
 *     "similar_count": 6,
 *     "complementary_count": 4,
 *     "repeat_prevention_applied": true,
 *     "fresh_candidates_count": 38,
 *     "fallback_used": false
 *   },
 *   "delivery_rules": {
 *     "is_plus": false,
 *     "user_limit": 5,
 *     "actual_delivery_count": 5
 *   }
 * }
 */
