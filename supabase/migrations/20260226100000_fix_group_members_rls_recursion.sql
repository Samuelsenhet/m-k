-- Fix infinite recursion in group_members RLS policy (PostgreSQL 42P17)
--
-- Problem: The SELECT policy on group_members queries group_members itself
-- to check membership, causing infinite recursion.
--
-- Solution: Use a SECURITY DEFINER function that bypasses RLS when checking
-- membership, breaking the recursive cycle.

-- 1. Create a stable SECURITY DEFINER helper that checks membership
--    without triggering RLS on group_members.
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_group_member(UUID) TO authenticated;

-- 2. Replace the recursive SELECT policy with one that uses the helper.
DROP POLICY IF EXISTS "Group members can view group_members" ON public.group_members;
CREATE POLICY "Group members can view group_members"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id));

-- 3. Also fix group_messages SELECT policy which has the same pattern.
DROP POLICY IF EXISTS "Group members can view group_messages" ON public.group_messages;
CREATE POLICY "Group members can view group_messages"
  ON public.group_messages FOR SELECT
  USING (public.is_group_member(group_id));

-- 4. Fix group_messages INSERT policy (same pattern).
DROP POLICY IF EXISTS "Group members can insert group_messages" ON public.group_messages;
CREATE POLICY "Group members can insert group_messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_group_member(group_id)
  );

-- 5. Fix group_members INSERT policy (references group_members recursively).
DROP POLICY IF EXISTS "Group creator or member can insert members" ON public.group_members;
CREATE POLICY "Group creator or member can insert members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    OR public.is_group_member(group_id)
  );
