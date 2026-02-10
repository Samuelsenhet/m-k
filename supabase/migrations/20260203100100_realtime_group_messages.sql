-- Enable Realtime for group_messages so new messages appear live in GroupChatRoom
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

