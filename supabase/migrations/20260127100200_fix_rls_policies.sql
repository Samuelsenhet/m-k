-- Migration: Fix RLS Policies for profiles and personality_results
-- Fixes 404 errors on these tables

-- ============================================
-- PROFILES TABLE RLS FIXES
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile or matches" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- SELECT: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- INSERT: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- DELETE: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
USING (id = auth.uid());

-- ============================================
-- PERSONALITY_RESULTS TABLE RLS FIXES
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE public.personality_results ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own personality results" ON public.personality_results;
DROP POLICY IF EXISTS "Users can insert their own personality results" ON public.personality_results;
DROP POLICY IF EXISTS "Users can update their own personality results" ON public.personality_results;
DROP POLICY IF EXISTS "Users can delete their own personality results" ON public.personality_results;

-- SELECT: Users can view their own results
CREATE POLICY "Users can view their own personality results"
ON public.personality_results FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Users can insert their own results
CREATE POLICY "Users can insert their own personality results"
ON public.personality_results FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own results
CREATE POLICY "Users can update their own personality results"
ON public.personality_results FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own results
CREATE POLICY "Users can delete their own personality results"
ON public.personality_results FOR DELETE
USING (user_id = auth.uid());
