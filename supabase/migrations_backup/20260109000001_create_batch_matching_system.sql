-- Migration: Create batch-based matching system tables
-- Date: 2026-01-09
-- Description: Implements admin-controlled global batch matching with user pools

-- 1. Daily Match Batches (Admin Controls)
-- Stores the global batch configuration set by admin
CREATE TABLE IF NOT EXISTS daily_match_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  batch_size INTEGER NOT NULL CHECK (batch_size >= 3 AND batch_size <= 10),
  candidate_profiles JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick date lookups
CREATE INDEX idx_daily_match_batches_date ON daily_match_batches(date);

-- 2. User Daily Match Pool
-- Pre-ranked candidates for each user before delivery
CREATE TABLE IF NOT EXISTS user_daily_match_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL in MVP
  UNIQUE(user_id, date)
);

-- Indexes for quick lookups
CREATE INDEX idx_user_daily_match_pool_user_date ON user_daily_match_pool(user_id, date);
CREATE INDEX idx_user_daily_match_pool_date ON user_daily_match_pool(date);

-- 3. Last Daily Matches (Repeat Prevention)
-- Tracks matches delivered yesterday to prevent same-day-after repeat
CREATE TABLE IF NOT EXISTS last_daily_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  match_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Index for quick user lookups
CREATE INDEX idx_last_daily_matches_user_date ON last_daily_matches(user_id, date);

-- 4. Icebreakers Used (Track Usage)
-- Stores which icebreaker was selected for each match
CREATE TABLE IF NOT EXISTS icebreakers_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  selected_icebreaker_text TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Index for quick match lookups
CREATE INDEX idx_icebreakers_used_user_id ON icebreakers_used(user_id);
CREATE INDEX idx_icebreakers_used_match_id ON icebreakers_used(match_id);

-- Enable Row Level Security
ALTER TABLE daily_match_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_match_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE last_daily_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE icebreakers_used ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_match_batches (Admin only write, all read)
CREATE POLICY "Admin can insert daily batches"
  ON daily_match_batches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update daily batches"
  ON daily_match_batches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "All authenticated users can view batches"
  ON daily_match_batches FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_daily_match_pool (Users see only their pool)
CREATE POLICY "Users can view their own match pool"
  ON user_daily_match_pool FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert match pools"
  ON user_daily_match_pool FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own match pool"
  ON user_daily_match_pool FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for last_daily_matches (Users see only their history)
CREATE POLICY "Users can view their last matches"
  ON last_daily_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert last matches"
  ON last_daily_matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update last matches"
  ON last_daily_matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for icebreakers_used (Users see only their icebreakers)
CREATE POLICY "Users can view their icebreaker usage"
  ON icebreakers_used FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their icebreaker usage"
  ON icebreakers_used FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for daily_match_batches
CREATE OR REPLACE FUNCTION update_daily_match_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_match_batches_updated_at
  BEFORE UPDATE ON daily_match_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_match_batches_updated_at();

-- Add 'role' column to profiles if it doesn't exist (for admin checks)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE daily_match_batches IS 'Admin-controlled global batch configuration for daily matching';
COMMENT ON TABLE user_daily_match_pool IS 'Pre-ranked match candidates for each user before delivery';
COMMENT ON TABLE last_daily_matches IS 'Tracks yesterday''s matches to prevent same-day-after repeats';
COMMENT ON TABLE icebreakers_used IS 'Records which icebreaker was selected for each match conversation';
