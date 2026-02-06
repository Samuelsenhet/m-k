-- =============================================================================
-- RLS AND SCHEMA ALIGNMENT – Run after ONE_TIME_SETUP.sql if needed
-- Aligns DB with app usage: matches status 'passed', UPDATE policy for mutual,
-- last_daily_matches table for match-daily Edge Function, matches columns for match-daily insert
-- =============================================================================

-- 0. MATCHES: Add columns expected by match-daily Edge Function (if table has only compatibility_score)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'match_score') THEN
    ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_score DECIMAL(5,2);
    UPDATE public.matches SET match_score = compatibility_score WHERE match_score IS NULL AND compatibility_score IS NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'match_type') THEN
    ALTER TABLE public.matches ADD COLUMN match_type TEXT DEFAULT 'similar';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'dimension_breakdown') THEN
    ALTER TABLE public.matches ADD COLUMN dimension_breakdown JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'archetype_score') THEN
    ALTER TABLE public.matches ADD COLUMN archetype_score INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'anxiety_reduction_score') THEN
    ALTER TABLE public.matches ADD COLUMN anxiety_reduction_score INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'icebreakers') THEN
    ALTER TABLE public.matches ADD COLUMN icebreakers TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'personality_insight') THEN
    ALTER TABLE public.matches ADD COLUMN personality_insight TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'match_age') THEN
    ALTER TABLE public.matches ADD COLUMN match_age INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'match_archetype') THEN
    ALTER TABLE public.matches ADD COLUMN match_archetype TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'photo_urls') THEN
    ALTER TABLE public.matches ADD COLUMN photo_urls TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'bio_preview') THEN
    ALTER TABLE public.matches ADD COLUMN bio_preview TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'common_interests') THEN
    ALTER TABLE public.matches ADD COLUMN common_interests TEXT[] DEFAULT '{}';
  END IF;
  -- match_date: base migration may have match_date TIMESTAMPTZ; Edge Function sends string (YYYY-MM-DD). Postgres accepts it.
END $$;

-- 1. MATCHES: Allow status 'passed' (app uses it; migration had 'disliked')
DO $$
DECLARE
  conname text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches') THEN
    RETURN;
  END IF;
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public' AND t.relname = 'matches' AND c.contype = 'c'
  LIMIT 1;
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS %I', conname);
  END IF;
  ALTER TABLE public.matches ADD CONSTRAINT matches_status_check
    CHECK (status IN ('pending', 'liked', 'passed', 'disliked', 'mutual'));
EXCEPTION
  WHEN duplicate_object THEN NULL; -- constraint already exists
END $$;

-- 2. MATCHES: Allow UPDATE when user is matched_user_id (for mutual-like flow)
-- So the other user's row can be updated to 'mutual' when we like them
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own matches" ON public.matches;
CREATE POLICY "Users can update their own matches" ON public.matches
  FOR UPDATE
  USING (user_id = auth.uid() OR matched_user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR matched_user_id = auth.uid());

-- 3. LAST_DAILY_MATCHES: Used by match-daily Edge Function for repeat prevention
-- Create if not exists (no migration defines it)
CREATE TABLE IF NOT EXISTS public.last_daily_matches (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  match_ids UUID[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.last_daily_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own last_daily_matches" ON public.last_daily_matches;
CREATE POLICY "Users can manage own last_daily_matches" ON public.last_daily_matches
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. PROFILES: Ensure SELECT allows viewing match profiles (if a later migration removed it)
-- ONE_TIME_SETUP already has "Users can view their own profile or matches" with id IN (matches).
-- If you only have "Users can view their own profile", add the matches subquery:
-- (This block is idempotent: drop and recreate the combined policy.)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile or matches" ON public.profiles;
CREATE POLICY "Users can view their own profile or matches" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() OR user_id = auth.uid()
    OR id IN (
      SELECT matched_user_id FROM public.matches WHERE user_id = auth.uid()
      UNION
      SELECT user_id FROM public.matches WHERE matched_user_id = auth.uid()
    )
  );

-- 5. MESSAGES: Ensure SELECT allows viewing messages in matches (participant = user or matched)
-- complete_schema_setup uses match participation; rls_all_policy_fix used only sender_id.
-- Prefer participation-based so recipients can read messages.
DROP POLICY IF EXISTS "Users can view messages from their matches" ON public.messages;
CREATE POLICY "Users can view messages from their matches" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
    )
  );
