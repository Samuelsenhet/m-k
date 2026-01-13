-- Remove unused indexes that are candidates for removal
DROP INDEX IF EXISTS public.idx_consents_user_id;
DROP INDEX IF EXISTS public.idx_matches_matched_user_id;
DROP INDEX IF EXISTS public.idx_messages_match_id;
DROP INDEX IF EXISTS public.idx_messages_sender_id;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
