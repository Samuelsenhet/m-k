-- Schedule compute-user-embeddings daily at 00:45 CET — after match-daily
-- (23:00 UTC) and compute-engagement-scores (00:30 CET). The function reads
-- profiles with stale or missing user_signals rows and writes
-- bio_embedding + answers_embedding for each.
--
-- Reuses the vault secrets already configured for compute-engagement-scores
-- and generate-match-pools (same tenant base URL + service role key).
--
-- Pattern: same as 20260418170000_compute_engagement_scores_cron.sql.

SELECT cron.schedule(
  'compute-user-embeddings-daily',
  '45 0 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'generate_pools_base_url') || '/functions/v1/compute-user-embeddings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'generate_pools_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
