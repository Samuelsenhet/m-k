-- Update group_chats.updated_at when a new message is inserted so list order reflects activity.
CREATE OR REPLACE FUNCTION public.set_group_chat_updated_at_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.group_chats
  SET updated_at = timezone('utc'::text, now())
  WHERE id = NEW.group_chat_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS group_chat_messages_set_updated_at ON public.group_chat_messages;
CREATE TRIGGER group_chat_messages_set_updated_at
  AFTER INSERT ON public.group_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_group_chat_updated_at_on_message();
