-- Schedule purge-deactivated-accounts daily at 03:00 UTC. The function hard-
-- deletes profiles whose deactivated_at timestamp is older than 90 days.
--
-- Reuses the vault secrets already configured for generate-match-pools /
-- compute-engagement-scores: generate_pools_base_url +
-- generate_pools_service_role_key.

SELECT cron.schedule(
  'purge-deactivated-accounts-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'generate_pools_base_url') || '/functions/v1/purge-deactivated-accounts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'generate_pools_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
