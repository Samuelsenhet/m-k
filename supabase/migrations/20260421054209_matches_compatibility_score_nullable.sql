-- Make compatibility_score nullable so match-daily edge fn inserts stop failing.
-- Edge fn writes the newer match_score column; compatibility_score was pre-rewrite
-- legacy and nothing writes to it now.
--
-- This migration was applied to prod via the Supabase SQL editor on
-- 2026-04-21 05:42:09 UTC (dashboard emergency fix). The file here simply
-- backfills the migration history locally so `db push` stops complaining
-- about "Remote migration versions not found in local migrations directory".
--
-- Idempotent: DROP NOT NULL on an already-nullable column is a no-op on Postgres.

ALTER TABLE public.matches
  ALTER COLUMN compatibility_score DROP NOT NULL;

NOTIFY pgrst, 'reload schema';
