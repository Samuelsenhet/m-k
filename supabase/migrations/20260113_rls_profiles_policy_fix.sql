-- Fix RLS performance and combine permissive policies for public.profiles
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of their matches" ON public.profiles;

-- Create combined policy with select-auth pattern
CREATE POLICY "Users can view their own profile or matches"
  ON public.profiles FOR SELECT
  USING (
    id = (select auth.uid())
    OR
    id IN (select matched_user_id from public.matches where user_id = (select auth.uid()))
  );

-- Repeat for UPDATE and INSERT if needed (example for UPDATE)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (
    id = (select auth.uid())
  );

-- Example for INSERT
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    id = (select auth.uid())
  );
