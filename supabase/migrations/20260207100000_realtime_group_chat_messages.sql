-- Add group_chat_messages to Realtime publication so the app receives live inserts.
-- Requires: 20260201100000_add_group_chat_tables.sql must have been run first (table must exist).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'group_chat_messages')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_chat_messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;
  END IF;
END $$;
