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
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only creator can update/delete group
DROP POLICY IF EXISTS "Group creator can update group" ON public.groups;
CREATE POLICY "Group creator can update group"
  ON public.groups FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Group creator can delete group" ON public.groups;
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
DROP POLICY IF EXISTS "Group members can view group" ON public.groups;
CREATE POLICY "Group members can view group"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

-- Members can view other members of their groups
DROP POLICY IF EXISTS "Group members can view group_members" ON public.group_members;
CREATE POLICY "Group members can view group_members"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

-- Self-join, or creator/existing member can add others
DROP POLICY IF EXISTS "Group creator or member can insert members" ON public.group_members;
CREATE POLICY "Group creator or member can insert members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
  );

-- Creator can delete members; members can delete themselves (leave)
DROP POLICY IF EXISTS "Creator or self can delete group_members" ON public.group_members;
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
DROP POLICY IF EXISTS "Group members can view group_messages" ON public.group_messages;
CREATE POLICY "Group members can view group_messages"
  ON public.group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id AND user_id = auth.uid()
    )
  );

-- Only group members can send messages
DROP POLICY IF EXISTS "Group members can insert group_messages" ON public.group_messages;
CREATE POLICY "Group members can insert group_messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id AND user_id = auth.uid()
    )
  );

-- Sender can update own message (e.g. edit content)
DROP POLICY IF EXISTS "Sender can update own group_message" ON public.group_messages;
CREATE POLICY "Sender can update own group_message"
  ON public.group_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Group members can mark messages as read via RPC (see below)
-- Direct UPDATE for read_by is handled by the SECURITY DEFINER RPC.

-- Trigger: prevent tampering with read_by (append-only)
CREATE OR REPLACE FUNCTION public.prevent_read_by_tamper()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if read_by is unchanged
  IF NEW.read_by IS NOT DISTINCT FROM OLD.read_by THEN
    RETURN NEW;
  END IF;
  -- Allow only append: NEW.read_by must contain all elements of OLD.read_by
  IF NOT (OLD.read_by <@ NEW.read_by) THEN
    RAISE EXCEPTION 'read_by can only be appended to, not removed or overwritten';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_read_by_tamper ON public.group_messages;
CREATE TRIGGER trg_prevent_read_by_tamper
  BEFORE UPDATE ON public.group_messages
  FOR EACH ROW EXECUTE FUNCTION public.prevent_read_by_tamper();

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

-- ============================================
-- 4. RPC: mark group message as read
-- ============================================
-- SECURITY DEFINER so group members can append themselves to read_by
-- without needing a broad UPDATE policy on group_messages.
CREATE OR REPLACE FUNCTION public.mark_group_message_read(p_message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Get the group_id for the message
  SELECT group_id INTO v_group_id
    FROM public.group_messages
    WHERE id = p_message_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  -- Verify caller is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  -- Append caller to read_by if not already present
  UPDATE public.group_messages
    SET read_by = read_by || to_jsonb(auth.uid()::text)
    WHERE id = p_message_id
      AND NOT (read_by @> to_jsonb(auth.uid()::text));
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_group_message_read(UUID) TO authenticated;
