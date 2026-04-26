-- Monster Match v1 — schema additions for the new matching algorithm.
--
-- Spec: docs in /Users/samuelsenhet/.claude/plans/context-pure-taco.md.
-- Adds:
--   1) Five new columns on matches for LLM-generated content + match
--      classification + validation/fallback metadata
--   2) match_story_cache — keyed by archetype-pair × top dimensions × subtype
--      × locale; service_role only
--   3) match_validation_flags — logs cases where the math score and the LLM's
--      independent score disagree by >25; service_role only
--
-- All changes are additive and idempotent — safe to re-run, safe to ship
-- alongside Build 80 (which is currently in App Review).

-- ---------- 1) matches: new columns ----------

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_story text;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_subtype text;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS validation_score integer;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS validation_note text;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS fallback_used boolean DEFAULT false;

-- CHECK constraints (added separately so re-runs don't fail on existing rows).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_match_subtype_check'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_match_subtype_check
      CHECK (match_subtype IS NULL OR match_subtype IN ('similar', 'complementary', 'growth'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_validation_score_check'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_validation_score_check
      CHECK (validation_score IS NULL OR (validation_score BETWEEN 0 AND 100));
  END IF;
END$$;

-- ---------- 2) match_story_cache ----------

CREATE TABLE IF NOT EXISTS public.match_story_cache (
  cache_key text PRIMARY KEY,
  story text NOT NULL,
  breakdown jsonb NOT NULL,
  icebreakers jsonb NOT NULL,
  validation_score integer,
  validation_note text,
  locale text NOT NULL,
  hit_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_story_cache_last_used_at
  ON public.match_story_cache (last_used_at);

ALTER TABLE public.match_story_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role manages match_story_cache" ON public.match_story_cache;
CREATE POLICY "service_role manages match_story_cache" ON public.match_story_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------- 3) match_validation_flags ----------

CREATE TABLE IF NOT EXISTS public.match_validation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  math_score integer NOT NULL,
  llm_score integer NOT NULL,
  divergence integer NOT NULL,
  archetype_pair text,
  match_subtype text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_validation_flags_divergence
  ON public.match_validation_flags (divergence DESC);

CREATE INDEX IF NOT EXISTS idx_match_validation_flags_archetype_pair
  ON public.match_validation_flags (archetype_pair);

ALTER TABLE public.match_validation_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role manages match_validation_flags" ON public.match_validation_flags;
CREATE POLICY "service_role manages match_validation_flags" ON public.match_validation_flags
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------- 4) widen matches.match_type CHECK to accept 'growth' ----------

-- The existing match_type column was constrained to 'similar' or
-- 'complementary' before Monster Match v1 introduced the 'growth' subtype.
-- We don't know the exact name of the existing CHECK constraint (it varies
-- between environments), so we drop any CHECK that mentions match_type and
-- recreate a known-named one. Idempotent and safe to re-run.
DO $$
DECLARE
  existing_check text;
BEGIN
  FOR existing_check IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.matches'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%match_type%'
      AND conname <> 'matches_match_type_check'
  LOOP
    EXECUTE format('ALTER TABLE public.matches DROP CONSTRAINT %I', existing_check);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.matches'::regclass
      AND conname = 'matches_match_type_check'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_match_type_check
      CHECK (match_type IS NULL OR match_type IN ('similar', 'complementary', 'growth'));
  END IF;
END$$;

-- ---------- 5) refresh PostgREST schema cache ----------

-- Without this the next edge-function call hits "could not find the
-- 'match_story' column of 'matches' in the schema cache" until the
-- periodic reload picks it up. (Same pattern as the expires_at migration.)
NOTIFY pgrst, 'reload schema';
