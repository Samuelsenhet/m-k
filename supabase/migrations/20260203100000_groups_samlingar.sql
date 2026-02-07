-- Samlingar (group chat) – MÄÄK blueprint
-- Groups, group_members, group_messages + RLS

-- ============================================
-- 1. groups (Samlingar)
-- ============================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  theme_color VARCHAR(7) DEFAULT '#f472b6',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create groups (they become creator via group_members)
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only creator can update/delete group
CREATE POLICY "Group creator can update group"
  ON public.groups FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Group creator can delete group"
  ON public.groups FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- 2. group_members (Medlemmar i Samlingar)
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Only members can view a group (placed after group_members table creation)
CREATE POLICY "Group members can view group"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

-- Members can view other members of their groups
CREATE POLICY "Group members can view group_members"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

-- Creator adds members (enforced in app: only add users who are mutual matches)
CREATE POLICY "Group creator can insert members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    OR (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.groups g INNER JOIN public.group_members gm ON gm.group_id = g.id WHERE g.id = group_id AND gm.user_id = auth.uid()))
  );

-- Creator can delete members; members can delete themselves (leave)
CREATE POLICY "Creator or self can delete group_members"
  ON public.group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
  );

-- ============================================
-- 3. group_messages (Meddelanden i Samlingar)
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  read_by JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON public.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON public.group_messages(group_id, created_at DESC);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Only group members can read messages
CREATE POLICY "Group members can view group_messages"
  ON public.group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id AND user_id = auth.uid()
    )
  );

-- Only group members can send messages
CREATE POLICY "Group members can insert group_messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id AND user_id = auth.uid()
    )
  );

-- Sender can update own message (e.g. edit)
CREATE POLICY "Sender can update own group_message"
  ON public.group_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- ============================================
-- Trigger: updated_at for groups
-- ============================================
CREATE OR REPLACE FUNCTION public.set_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS groups_updated_at ON public.groups;
CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_groups_updated_at();

DROP TRIGGER IF EXISTS group_messages_updated_at ON public.group_messages;
CREATE TRIGGER group_messages_updated_at
  BEFORE UPDATE ON public.group_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_groups_updated_at();
