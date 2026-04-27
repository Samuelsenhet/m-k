-- Fix 42P17 infinite-recursion error between profiles / matches / messages RLS.
--
-- Background: 20260420100100_deactivation_rls.sql added inline `EXISTS (SELECT
-- FROM profiles ...)` checks inside the matches + messages policies to hide
-- deactivated counterparties. But the profiles SELECT policies already join
-- back into matches, so Postgres sees profiles → matches → profiles and bails
-- with "infinite recursion detected in policy for relation ..." (SQLSTATE
-- 42P17). The app was unable to load profiles or matches on iOS.
--
-- Break the cycle by moving the deactivation check into a SECURITY DEFINER
-- helper. SECURITY DEFINER bypasses RLS when inspecting profiles, so matches
-- policies stop declaring a dependency on the profiles policies.

CREATE OR REPLACE FUNCTION public.is_profile_visible(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND deactivated_at IS NOT NULL
      AND deactivation_hidden = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_profile_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_visible(uuid) TO authenticated, service_role;

-- matches SELECT: same intent, no inline profiles join.
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING (
    (auth.uid() = matches.user_id OR auth.uid() = matches.matched_user_id)
    AND public.is_profile_visible(
      CASE
        WHEN auth.uid() = matches.user_id THEN matches.matched_user_id
        ELSE matches.user_id
      END
    )
  );

-- messages SELECT: same rewrite.
DROP POLICY IF EXISTS "Users can view messages from their matches" ON public.messages;
CREATE POLICY "Users can view messages from their matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
        AND public.is_profile_visible(
          CASE
            WHEN m.user_id = auth.uid() THEN m.matched_user_id
            ELSE m.user_id
          END
        )
    )
  );

-- messages INSERT: same rewrite.
DROP POLICY IF EXISTS "Users can insert messages to their matches" ON public.messages;
CREATE POLICY "Users can insert messages to their matches" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = messages.sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
        AND public.is_profile_visible(
          CASE
            WHEN m.user_id = auth.uid() THEN m.matched_user_id
            ELSE m.user_id
          END
        )
    )
  );
