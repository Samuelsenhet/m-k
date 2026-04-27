-- Revoke anon role's table-level GRANTs on Monster Match v1 tables.
--
-- Pattern from 20260427010000_revoke_anon_data_api.sql — RLS already blocks
-- rows for these, but the default Supabase Data API GRANT exposes column
-- names + types via /graphql/v1 introspection (advisor lint
-- pg_graphql_anon_table_exposed).
--
-- All three are service_role-only by RLS — explicitly revoking anon GRANTs
-- closes the introspection leak.

REVOKE ALL ON TABLE public.user_signals             FROM anon;
REVOKE ALL ON TABLE public.match_story_cache        FROM anon;
REVOKE ALL ON TABLE public.match_validation_flags   FROM anon;
