-- Add DELETE RLS policy for messages table
-- Allows users to delete only their own sent messages

-- Ensure RLS is enabled (should already be, but safe to re-run)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop if exists (for idempotency)
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Create DELETE policy: users can only delete messages they sent
CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (sender_id = (SELECT auth.uid()));
