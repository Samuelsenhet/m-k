-- Fix Security Vulnerabilities

-- 1. Fix profile_photos: Replace public SELECT policy with authenticated-only
DROP POLICY IF EXISTS "Anyone can view profile photos metadata" ON public.profile_photos;

CREATE POLICY "Authenticated users can view profile photos"
ON public.profile_photos
FOR SELECT
TO authenticated
USING (true);

-- 2. Fix question_responses: Replace public SELECT with matches-only visibility
DROP POLICY IF EXISTS "Users can view all responses" ON public.question_responses;

CREATE POLICY "Users can view responses from their matches"
ON public.question_responses
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.matches 
    WHERE status = 'mutual'
    AND (
      (user_id = auth.uid() AND matched_user_id = question_responses.user_id)
      OR (matched_user_id = auth.uid() AND user_id = question_responses.user_id)
    )
  )
);

-- 3. Add UPDATE policy to messages for marking as read
CREATE POLICY "Users can mark messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = messages.match_id
    AND status = 'mutual'
    AND (user_id = auth.uid() OR matched_user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = messages.match_id
    AND status = 'mutual'
    AND (user_id = auth.uid() OR matched_user_id = auth.uid())
  )
);