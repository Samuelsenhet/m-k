-- Block system: users can block other users to prevent matching and chat
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can insert their own blocks
CREATE POLICY "Users can block others"
ON public.blocked_users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = blocker_id);

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
ON public.blocked_users FOR SELECT
TO authenticated
USING (auth.uid() = blocker_id);

-- Users can unblock (delete their own blocks)
CREATE POLICY "Users can unblock"
ON public.blocked_users FOR DELETE
TO authenticated
USING (auth.uid() = blocker_id);

-- Index for fast lookups in matching queries
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);
