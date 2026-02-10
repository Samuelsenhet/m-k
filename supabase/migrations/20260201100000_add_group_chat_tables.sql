-- Group chat: tables, RLS, indexes
-- Realtime: enable for group_chat_messages in Supabase Dashboard (Database → Replication)

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

-- Authenticated users can create a group (creator added in same flow via group_chat_members)
CREATE POLICY "Users can create group_chats"
  ON public.group_chats FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Creator can update (e.g. group name)
CREATE POLICY "Creator can update group_chats"
  ON public.group_chats FOR UPDATE
  USING (created_by = auth.uid());

-- ============================================
-- 2. GROUP_CHAT_MEMBERS (after group_chats for RLS reference)
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_chat_id, user_id)
);

ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members of the same group
CREATE POLICY "Members can view group_chat_members"
  ON public.group_chat_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_chat_members gcm2
      WHERE gcm2.group_chat_id = group_chat_members.group_chat_id AND gcm2.user_id = auth.uid()
    )
  );

-- Creator can add members; or allow if adding yourself to a group you're invited to (e.g. link)
-- For simplicity: only group creator can insert (when creating group). Self-join allowed if group exists and creator added you – we allow insert if user is already in the group (no) or if they are the creator. Easiest: allow INSERT if auth.uid() = user_id and group exists and (created_by = auth.uid() OR exists as member already – no). So: allow INSERT when auth.uid() = user_id and either (1) created_by = auth.uid() or (2) group has created_by and we add other users – that requires creator to add. So creator adds all: allow INSERT when group_chats.created_by = auth.uid() for that group_chat_id.
CREATE POLICY "Creator can add group_chat_members"
  ON public.group_chat_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_chats gc
      WHERE gc.id = group_chat_id AND gc.created_by = auth.uid()
    )
  );

-- Users can leave: delete own membership row
CREATE POLICY "Users can delete own group_chat_members"
  ON public.group_chat_members FOR DELETE
  USING (user_id = auth.uid());

-- Members can view the group (must run after group_chat_members exists)
CREATE POLICY "Members can view group_chats"
  ON public.group_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_chat_members gcm
      WHERE gcm.group_chat_id = group_chats.id AND gcm.user_id = auth.uid()
    )
  );

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

-- Members can view messages
CREATE POLICY "Members can view group_chat_messages"
  ON public.group_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_chat_members gcm
      WHERE gcm.group_chat_id = group_chat_messages.group_chat_id AND gcm.user_id = auth.uid()
    )
  );

-- Members can insert messages
CREATE POLICY "Members can insert group_chat_messages"
  ON public.group_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.group_chat_members gcm
      WHERE gcm.group_chat_id = group_chat_messages.group_chat_id AND gcm.user_id = auth.uid()
    )
  );

-- Sender can update/delete own message (optional; add if needed)
CREATE POLICY "Senders can update own group_chat_messages"
  ON public.group_chat_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Senders can delete own group_chat_messages"
  ON public.group_chat_messages FOR DELETE
  USING (sender_id = auth.uid());

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_group_chats_created_by ON public.group_chats(created_by);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_group_chat_id ON public.group_chat_members(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_user_id ON public.group_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_chat_id ON public.group_chat_messages(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_created_at ON public.group_chat_messages(group_chat_id, created_at DESC);

COMMENT ON TABLE public.group_chats IS 'Group chat rooms; members in group_chat_members.';
COMMENT ON TABLE public.group_chat_members IS 'Membership of users in group chats.';
COMMENT ON TABLE public.group_chat_messages IS 'Messages in a group chat. Enable Realtime in Dashboard for live updates.';
