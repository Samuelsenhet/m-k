-- Migration: Add category column to icebreakers table
-- Allows categorizing icebreakers by style (funny, deep, activity, compliment, general)

-- ============================================
-- 1. ADD CATEGORY COLUMN
-- ============================================
ALTER TABLE public.icebreakers
  ADD COLUMN IF NOT EXISTS category TEXT;

-- ============================================
-- 2. ADD CHECK CONSTRAINT FOR VALID CATEGORIES
-- ============================================
-- Drop existing constraint if present (for idempotency)
ALTER TABLE public.icebreakers
  DROP CONSTRAINT IF EXISTS icebreakers_category_check;

-- Add constraint to ensure valid categories
ALTER TABLE public.icebreakers
  ADD CONSTRAINT icebreakers_category_check
  CHECK (category IS NULL OR category IN ('funny', 'deep', 'activity', 'compliment', 'general'));

-- ============================================
-- 3. CREATE INDEX FOR CATEGORY QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_icebreakers_category
  ON public.icebreakers(category);

-- ============================================
-- 4. COMMENTS
-- ============================================
COMMENT ON COLUMN public.icebreakers.category IS 'Icebreaker style: funny (playful), deep (meaningful), activity (suggests doing something), compliment (genuine praise), general (mixed)';
