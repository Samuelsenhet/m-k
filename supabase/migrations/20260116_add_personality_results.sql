-- Migration: Add personality_results table for MBTI-style personality data
-- This replaces the Big Five model (personality_scores) with MBTI archetypes

-- ============================================
-- 1. CREATE PERSONALITY_RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.personality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scores JSONB NOT NULL DEFAULT '{}',
  archetype VARCHAR(4),  -- MBTI code like 'INFJ', 'ENFP', etc.
  category VARCHAR(20) NOT NULL,  -- 'DIPLOMAT', 'STRATEGER', 'BYGGARE', 'UPPTÄCKARE'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_personality UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_personality_results_user_id ON public.personality_results(user_id);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.personality_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES
-- ============================================
-- Users can view their own results
CREATE POLICY "Users can view their own personality results"
  ON public.personality_results
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Users can insert their own results
CREATE POLICY "Users can insert their own personality results"
  ON public.personality_results
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own results (though typically not allowed after first save)
CREATE POLICY "Users can update their own personality results"
  ON public.personality_results
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- Users can delete their own results (for account deletion)
CREATE POLICY "Users can delete their own personality results"
  ON public.personality_results
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- 4. COMMENTS
-- ============================================
COMMENT ON TABLE public.personality_results IS 'Stores MBTI-style personality test results';
COMMENT ON COLUMN public.personality_results.scores IS 'JSON object with dimension scores: {ei, sn, tf, jp, at} as 0-100 values';
COMMENT ON COLUMN public.personality_results.archetype IS 'MBTI archetype code (e.g., INFJ, ENFP, ISTJ)';
COMMENT ON COLUMN public.personality_results.category IS 'Personality category: DIPLOMAT, STRATEGER, BYGGARE, or UPPTÄCKARE';
