-- Profile views: who viewed whose profile (for "viewed you" feed)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(viewer_id, viewed_user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user_created
  ON public.profile_views (viewed_user_id, created_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Viewers can insert their own view; viewed user can see views of their profile
CREATE POLICY "Users can insert own profile view"
  ON public.profile_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can view profile views where they are the viewed user"
  ON public.profile_views FOR SELECT
  USING (auth.uid() = viewed_user_id);

-- Allow viewing profiles of users who viewed you (for "viewed you" feed names/avatars)
DROP POLICY IF EXISTS "Users can view profiles of users who viewed them" ON public.profiles;
CREATE POLICY "Users can view profiles of users who viewed them"
  ON public.profiles FOR SELECT
  USING (
    id IN (SELECT viewer_id FROM public.profile_views WHERE viewed_user_id = auth.uid())
  );

-- Allow viewing profiles of users who liked you (for "interested in you" feed)
DROP POLICY IF EXISTS "Users can view profiles of users who liked them" ON public.profiles;
CREATE POLICY "Users can view profiles of users who liked them"
  ON public.profiles FOR SELECT
  USING (
    id IN (SELECT user_id FROM public.matches WHERE matched_user_id = auth.uid() AND status = 'liked')
  );

-- Notification preferences: store on profiles so RLS already applies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'push_new_matches') THEN
    ALTER TABLE public.profiles ADD COLUMN push_new_matches BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'push_messages') THEN
    ALTER TABLE public.profiles ADD COLUMN push_messages BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_new_matches') THEN
    ALTER TABLE public.profiles ADD COLUMN email_new_matches BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_messages') THEN
    ALTER TABLE public.profiles ADD COLUMN email_messages BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Matches: allow matched_user_id to update row (accept/reject); allow status 'passed'
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check
  CHECK (status IN ('pending', 'liked', 'disliked', 'passed', 'mutual'));

-- Allow the "matched user" to update the row (e.g. accept or reject interest)
CREATE POLICY "Users can update matches where they are the matched user"
  ON public.matches FOR UPDATE
  USING (auth.uid() = matched_user_id);
