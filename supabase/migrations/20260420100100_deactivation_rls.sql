-- RLS adjustments for deactivated accounts.
--
-- When a user sets deactivated_at with deactivation_hidden = true, other users
-- must stop seeing them across three surfaces:
--   1. profiles.SELECT via the "view profiles of their matches" policy
--   2. matches.SELECT (so the chat row disappears from the inbox)
--   3. messages.SELECT (so history is hidden) and messages.INSERT (so no new
--      messages can be written to the deactivated user).
--
-- The owner always keeps SELECT/UPDATE on their own profile via the
-- "Users can view/update their own profile" policies (auth.uid() = id), so they
-- can still log in and reactivate. When deactivation_hidden = false the row is
-- still visible to others — the user just won't respond until reactivation.

-- Helper: inline predicate that returns true when the counterparty is
-- *visible* (not deactivated, or deactivated-but-visible).
-- Implemented inline in each policy to avoid a function dependency.

-- 1. profiles: hide dold-inaktiverade from the cross-user match view.
DROP POLICY IF EXISTS "Users can view profiles of their matches" ON public.profiles;
CREATE POLICY "Users can view profiles of their matches" ON public.profiles
  FOR SELECT USING (
    (profiles.deactivated_at IS NULL OR profiles.deactivation_hidden = false)
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE (matches.user_id = auth.uid() AND matches.matched_user_id = profiles.id)
         OR (matches.matched_user_id = auth.uid() AND matches.user_id = profiles.id)
    )
  );

-- 2. matches: hide rows whose counterparty is dold-inaktiverad so the chat
--    disappears from the other side's inbox.
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING (
    (auth.uid() = matches.user_id OR auth.uid() = matches.matched_user_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = CASE
          WHEN auth.uid() = matches.user_id THEN matches.matched_user_id
          ELSE matches.user_id
        END
        AND p.deactivated_at IS NOT NULL
        AND p.deactivation_hidden = true
    )
  );

-- 3. messages SELECT: the viewer must not be the owner of a hidden account
--    looking *at* the counterparty — but the deactivated owner has already
--    been signed out; the real case we guard is the *other* side losing access
--    to chats with a hidden-deactivated user.
DROP POLICY IF EXISTS "Users can view messages from their matches" ON public.messages;
CREATE POLICY "Users can view messages from their matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
        AND NOT EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = CASE
              WHEN m.user_id = auth.uid() THEN m.matched_user_id
              ELSE m.user_id
            END
            AND p.deactivated_at IS NOT NULL
            AND p.deactivation_hidden = true
        )
    )
  );

-- 4. messages INSERT: block sending to a dold-inaktiverad recipient. Synlig-
--    inaktiverade may still receive messages (they simply won't reply until
--    reactivation) so we only filter on deactivation_hidden = true.
DROP POLICY IF EXISTS "Users can insert messages to their matches" ON public.messages;
CREATE POLICY "Users can insert messages to their matches" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = messages.sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
        AND NOT EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = CASE
              WHEN m.user_id = auth.uid() THEN m.matched_user_id
              ELSE m.user_id
            END
            AND p.deactivated_at IS NOT NULL
            AND p.deactivation_hidden = true
        )
    )
  );
