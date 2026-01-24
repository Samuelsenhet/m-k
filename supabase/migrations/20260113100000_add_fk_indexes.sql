-- Add covering indexes for foreign keys to improve performance
CREATE INDEX IF NOT EXISTS idx_consents_user_id ON public.consents(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON public.matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
