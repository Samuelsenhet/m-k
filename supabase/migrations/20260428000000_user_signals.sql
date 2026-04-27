-- Monster Match v1 — feature store for synthesis-layer signals.
--
-- Spec: docs/MONSTER_MATCH_V1.md (synthesis refit, plan 2026-04-28)
--
-- Single per-user row consumed by generate-match-pools when MONSTER_MATCH_ENABLED.
-- Adding new signals later = adding nullable columns, NOT refactoring scoring.
-- Scoring degrades gracefully when a signal is null (weight × 0 contribution).
--
-- v1 (Build 81):  bio_embedding, answers_embedding populated by nightly cron.
-- v1.1 (Build 82): response_time_p50, kemi_check_avg_seconds, message_depth_p50,
--                  photo_aesthetic_tags populated from production behavioral data.
--
-- All changes additive and idempotent. Safe to ship while Build 80 is in App
-- Review — Build 80 does not read this table.

-- ---------- 0) pgvector extension ----------

-- Installed here in the public schema; the follow-up migration
-- 20260428000200_move_vector_to_extensions_schema moves it into
-- the dedicated `extensions` schema (matches pgcrypto, pg_net, wrappers).
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------- 1) user_signals table ----------

CREATE TABLE IF NOT EXISTS public.user_signals (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- v1: synthesis-layer embeddings (1536 dims = OpenAI text-embedding-3-small,
  -- Voyage voyage-3-lite, Cohere embed-english-light-v3.0, etc.)
  bio_embedding vector(1536),
  answers_embedding vector(1536),

  -- v1.1: behavioral signals (populated once Build 81 has produced ~7 days of
  -- production data). Nullable; scoring contributes 0 when null.
  response_time_p50 numeric,
  kemi_check_avg_seconds numeric,
  message_depth_p50 numeric,

  -- v1.1: vision-derived photo aesthetics (e.g. {"tags": ["cozy","outdoorsy"]}).
  photo_aesthetic_tags jsonb,

  -- Tracking. signals_updated_at is bumped by the embedding cron so we know
  -- when a user's vectors are stale and need recompute.
  signals_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- 2) indexes ----------

-- HNSW index on bio_embedding for fast cosine-similarity ANN search during
-- candidate ranking. m=16 / ef_construction=64 are pgvector defaults — tune
-- after we have meaningful row counts (>1000 users).
CREATE INDEX IF NOT EXISTS idx_user_signals_bio_embedding_hnsw
  ON public.user_signals
  USING hnsw (bio_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_user_signals_answers_embedding_hnsw
  ON public.user_signals
  USING hnsw (answers_embedding vector_cosine_ops);

-- Index for the cron to find stale rows (where signals_updated_at < now() - 7d).
CREATE INDEX IF NOT EXISTS idx_user_signals_signals_updated_at
  ON public.user_signals (signals_updated_at);

-- ---------- 3) RLS ----------

ALTER TABLE public.user_signals ENABLE ROW LEVEL SECURITY;

-- service_role manages everything. RLS default-deny applies to anon and
-- authenticated, which is what we want for v1 — the app does not read signals
-- directly. (If a user-facing transparency feature is added later, add a
-- SELECT-own-row policy in a follow-up migration.)
DROP POLICY IF EXISTS "service_role manages user_signals" ON public.user_signals;
CREATE POLICY "service_role manages user_signals" ON public.user_signals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------- 4) refresh PostgREST schema cache ----------

NOTIFY pgrst, 'reload schema';
