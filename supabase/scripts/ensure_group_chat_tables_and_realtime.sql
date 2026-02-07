-- Run this in Supabase Dashboard → SQL Editor if group_chat_* tables or Realtime are missing.
-- Creates group_chats, group_chat_members, group_chat_messages and adds group_chat_messages to Realtime.

-- ============================================
-- 1. GROUP_CHATS
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Gruppchatt',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create group_chats" ON public.group_chats;
CREATE POLICY "Users can create group_chats" ON public.group_chats FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creator can update group_chats" ON public.group_chats;
CREATE POLICY "Creator can update group_chats" ON public.group_chats FOR UPDATE USING (created_by = auth.uid());

-- ============================================
-- 2. GROUP_CHAT_MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_chat_id, user_id)
);

ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view group_chat_members" ON public.group_chat_members;
CREATE POLICY "Members can view group_chat_members" ON public.group_chat_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.group_chat_members gcm2 WHERE gcm2.group_chat_id = group_chat_members.group_chat_id AND gcm2.user_id = auth.uid()));

DROP POLICY IF EXISTS "Creator can add group_chat_members" ON public.group_chat_members;
CREATE POLICY "Creator can add group_chat_members" ON public.group_chat_members FOR INSERT
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.group_chats gc WHERE gc.id = group_chat_id AND gc.created_by = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own group_chat_members" ON public.group_chat_members;
CREATE POLICY "Users can delete own group_chat_members" ON public.group_chat_members FOR DELETE USING (user_id = auth.uid());

-- Members can view group (after group_chat_members exists)
DROP POLICY IF EXISTS "Members can view group_chats" ON public.group_chats;
CREATE POLICY "Members can view group_chats" ON public.group_chats FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.group_chat_members gcm WHERE gcm.group_chat_id = group_chats.id AND gcm.user_id = auth.uid()));

-- ============================================
-- 3. GROUP_CHAT_MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view group_chat_messages" ON public.group_chat_messages;
CREATE POLICY "Members can view group_chat_messages" ON public.group_chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.group_chat_members gcm WHERE gcm.group_chat_id = group_chat_messages.group_chat_id AND gcm.user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can insert group_chat_messages" ON public.group_chat_messages;
CREATE POLICY "Members can insert group_chat_messages" ON public.group_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.group_chat_members gcm WHERE gcm.group_chat_id = group_chat_messages.group_chat_id AND gcm.user_id = auth.uid()));

DROP POLICY IF EXISTS "Senders can update own group_chat_messages" ON public.group_chat_messages;
CREATE POLICY "Senders can update own group_chat_messages" ON public.group_chat_messages FOR UPDATE USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Senders can delete own group_chat_messages" ON public.group_chat_messages;
CREATE POLICY "Senders can delete own group_chat_messages" ON public.group_chat_messages FOR DELETE USING (sender_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_chats_created_by ON public.group_chats(created_by);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_group_chat_id ON public.group_chat_members(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_user_id ON public.group_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_chat_id ON public.group_chat_messages(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_created_at ON public.group_chat_messages(group_chat_id, created_at DESC);

-- Add to Realtime publication (so it shows in Publications and live updates work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;
  END IF;
END $$;
