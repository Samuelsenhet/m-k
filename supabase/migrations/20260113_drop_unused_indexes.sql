-- Remove unused indexes for performance
DROP INDEX IF EXISTS public.logs_user_id_idx;
DROP INDEX IF EXISTS public.idx_matches_user_id;
DROP INDEX IF EXISTS public.idx_matches_matched_user_id;
DROP INDEX IF EXISTS public.idx_matches_status;
DROP INDEX IF EXISTS public.idx_messages_match_id;
DROP INDEX IF EXISTS public.idx_messages_sender_id;
DROP INDEX IF EXISTS public.idx_user_daily_match_pools_user_date;
DROP INDEX IF EXISTS public.idx_user_match_delivery_status_user_id;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
DROP INDEX IF EXISTS public.idx_consents_user_id;
