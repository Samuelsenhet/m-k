-- Migration: Add icebreaker_analytics table
-- Tracks icebreaker usage and outcomes to learn which styles work best

-- ============================================
-- 1. CREATE ICEBREAKER_ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.icebreaker_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  icebreaker_text TEXT NOT NULL,
  category TEXT,  -- 'funny', 'deep', 'activity', 'compliment', 'general'
  was_used BOOLEAN NOT NULL DEFAULT false,
  led_to_response BOOLEAN,
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_icebreaker_analytics_match_id
  ON public.icebreaker_analytics(match_id);

CREATE INDEX IF NOT EXISTS idx_icebreaker_analytics_user_id
  ON public.icebreaker_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_icebreaker_analytics_category
  ON public.icebreaker_analytics(category);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.icebreaker_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES (idempotent)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own icebreaker analytics" ON public.icebreaker_analytics;
DROP POLICY IF EXISTS "Users can insert their own icebreaker analytics" ON public.icebreaker_analytics;
DROP POLICY IF EXISTS "Users can update their own icebreaker analytics" ON public.icebreaker_analytics;

-- Users can view their own analytics
CREATE POLICY "Users can view their own icebreaker analytics"
  ON public.icebreaker_analytics
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Users can insert their own analytics
CREATE POLICY "Users can insert their own icebreaker analytics"
  ON public.icebreaker_analytics
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own analytics (e.g., mark led_to_response)
CREATE POLICY "Users can update their own icebreaker analytics"
  ON public.icebreaker_analytics
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- 5. COMMENTS
-- ============================================
COMMENT ON TABLE public.icebreaker_analytics IS 'Tracks icebreaker usage and conversation outcomes for ML/analytics';
COMMENT ON COLUMN public.icebreaker_analytics.category IS 'Icebreaker style: funny, deep, activity, compliment, or general';
COMMENT ON COLUMN public.icebreaker_analytics.was_used IS 'True if user clicked/sent this icebreaker';
COMMENT ON COLUMN public.icebreaker_analytics.led_to_response IS 'True if match replied within 24h after icebreaker was sent';
COMMENT ON COLUMN public.icebreaker_analytics.response_time_seconds IS 'Seconds between icebreaker sent and first response';
