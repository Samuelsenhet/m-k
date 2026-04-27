-- =============================================================================
-- PERFORMANCE INDEXES - Address Supabase performance warnings
-- Adds indexes for foreign keys and commonly queried columns
-- =============================================================================

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- Personality scores
CREATE INDEX IF NOT EXISTS idx_personality_scores_user_id ON public.personality_scores(user_id);

-- Privacy settings
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON public.privacy_settings(user_id);

-- Matches table indexes (critical for app performance)
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON public.matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_user_status ON public.matches(user_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_matched_status ON public.matches(matched_user_id, status);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON public.messages(match_id, created_at DESC);

-- User achievements (column might be 'achievement_code' or similar)
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
-- Skip achievement_type index - column may not exist or be named differently

-- User match delivery status
CREATE INDEX IF NOT EXISTS idx_user_match_delivery_status_user_id ON public.user_match_delivery_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_match_delivery_status_date ON public.user_match_delivery_status(last_delivered_date);

-- Last daily matches (if exists) - skip date index, column name varies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'last_daily_matches') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_last_daily_matches_user_id ON public.last_daily_matches(user_id)';
  END IF;
END $$;

-- Reports table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC)';
  END IF;
END $$;

-- Profile photos (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profile_photos') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profile_photos_order ON public.profile_photos(user_id, display_order)';
  END IF;
END $$;

-- ID verification requests (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'id_verification_requests') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_verification_user_id ON public.id_verification_requests(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_verification_status ON public.id_verification_requests(status)';
  END IF;
END $$;

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_matches_active ON public.matches(user_id, matched_user_id)
  WHERE status IN ('pending', 'active', 'mutual');

CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(match_id, created_at)
  WHERE read_at IS NULL;

-- Analyze tables after adding indexes
ANALYZE public.profiles;
ANALYZE public.matches;
ANALYZE public.messages;
ANALYZE public.personality_scores;
ANALYZE public.privacy_settings;
ANALYZE public.user_achievements;
