-- Behavioral scoring: tracks match outcomes to improve future matching.
-- Stores per-user engagement signals that feed into match pool generation.

-- Match engagement metrics (computed daily from messages/matches tables).
CREATE TABLE IF NOT EXISTS match_engagement_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,

  -- Engagement signals
  messages_sent int NOT NULL DEFAULT 0,
  messages_received int NOT NULL DEFAULT 0,
  avg_response_time_minutes numeric,
  conversation_duration_hours numeric,
  initiated_chat boolean NOT NULL DEFAULT false,

  -- Match metadata for ML training
  match_type text, -- 'similar' | 'complementary'
  personality_distance numeric, -- Euclidean distance (0-500)
  archetype_alignment numeric, -- Score 0-100

  -- Outcome
  outcome text NOT NULL DEFAULT 'pending',
    -- pending: match delivered, no action yet
    -- chatted: at least 1 message exchanged
    -- engaged: 5+ messages exchanged
    -- deep: 20+ messages or 24h+ conversation
    -- passed: user passed without chatting
    -- expired: match expired without interaction

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, matched_user_id)
);

-- User-level aggregated preference weights (learned from outcomes).
CREATE TABLE IF NOT EXISTS user_match_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Learned weight adjustments (multipliers, 1.0 = default)
  personality_weight numeric NOT NULL DEFAULT 1.0,
  archetype_weight numeric NOT NULL DEFAULT 1.0,
  interest_weight numeric NOT NULL DEFAULT 1.0,

  -- Preferred match type ratio (default 0.6 similar / 0.4 complementary)
  similar_ratio numeric NOT NULL DEFAULT 0.6,

  -- Stats
  total_matches int NOT NULL DEFAULT 0,
  engaged_matches int NOT NULL DEFAULT 0,
  deep_matches int NOT NULL DEFAULT 0,

  -- Collaborative filtering: top recommended user IDs with confidence (0-1).
  collaborative_boosts jsonb DEFAULT '[]'::jsonb,

  -- A/B test bucket (0-99, assigned on first match)
  ab_bucket int NOT NULL DEFAULT floor(random() * 100),

  updated_at timestamptz DEFAULT now()
);

-- RLS: users can read their own data.
ALTER TABLE match_engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_match_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own engagement scores"
  ON match_engagement_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own match preferences"
  ON user_match_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (Edge Functions use service role).
CREATE POLICY "Service role full access on engagement"
  ON match_engagement_scores FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on preferences"
  ON user_match_preferences FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Index for fast lookups.
CREATE INDEX IF NOT EXISTS idx_engagement_user ON match_engagement_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_outcome ON match_engagement_scores(outcome);
