-- Move pgvector out of public schema into the dedicated `extensions` schema,
-- matching the convention used by pgcrypto, pg_net, wrappers, supabase_vault.
-- Silences advisor lint 0014_extension_in_public.
--
-- Existing user_signals.{bio_embedding, answers_embedding} columns reference
-- the vector type by OID, not by qualified name, so they continue to work.

ALTER EXTENSION vector SET SCHEMA extensions;
