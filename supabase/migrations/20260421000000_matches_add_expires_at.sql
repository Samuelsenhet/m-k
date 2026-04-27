-- Add matches.expires_at column.
--
-- Why: match-daily edge fn (supabase/functions/match-daily/index.ts) inserts
-- each new match with `expires_at = now() + 24h` and later filters pending
-- matches whose expires_at has passed. The column was referenced in the edge
-- function code but the DDL was never shipped — so every insert from
-- match-daily fails with PGRST204:
--
--   "Could not find the 'expires_at' column of 'matches' in the schema cache"
--
-- Symptom in the app: after onboarding the Matches tab renders the
-- "Vi har problem att hämta matchningar just nu" error state, which is also
-- what Apple App Review saw on iPhone 17 Pro Max (guideline 2.1(a)).
--
-- Idempotent: uses IF NOT EXISTS so the migration can be re-applied safely
-- and can be run manually via SQL Editor on projects that are already in
-- this broken state.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Index supports the "expire pending matches older than now()" sweep in
-- match-daily (index.ts line ~333) and any future cron that garbage-collects
-- stale pending matches.
CREATE INDEX IF NOT EXISTS idx_matches_pending_expires_at
  ON public.matches (expires_at)
  WHERE status = 'pending';

-- Force PostgREST to refresh its schema cache so the next edge-function
-- invocation sees the new column immediately instead of waiting for the
-- periodic cache reload.
NOTIFY pgrst, 'reload schema';
