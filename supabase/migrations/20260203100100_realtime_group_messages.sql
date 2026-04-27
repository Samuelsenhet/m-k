-- Enable Realtime for group_messages so new messages appear live in GroupChatRoom
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'group_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
  END IF;
END $$;
