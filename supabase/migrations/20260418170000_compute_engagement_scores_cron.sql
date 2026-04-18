-- Schedule compute-engagement-scores daily at 00:30 CET (after match-daily
-- which runs at 23:00). The function aggregates message/match data into
-- match_engagement_scores and user_match_preferences, which in turn feed
-- into generate-match-pools' personalised scoring.
--
-- Reuses the vault secrets already configured for generate-match-pools —
-- the base URL and service role key are the same tenant-wide.

SELECT cron.schedule(
  'compute-engagement-scores-daily',
  '30 0 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'generate_pools_base_url') || '/functions/v1/compute-engagement-scores',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'generate_pools_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
