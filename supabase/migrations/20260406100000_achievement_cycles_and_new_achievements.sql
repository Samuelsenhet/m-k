-- Fas 2: Refactor achievements to catalog + user_achievements, add cycles, seed data.

-- ============================================
-- 1. Drop old grant_achievement function (references old schema)
-- ============================================
DROP FUNCTION IF EXISTS public.grant_achievement(UUID, TEXT);

-- ============================================
-- 2. Rebuild achievements as a catalog table
-- ============================================

-- Drop ALL old RLS policies on achievements
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'achievements' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.achievements', pol.policyname);
  END LOOP;
END $$;

-- Drop old unique constraint & columns, add new catalog columns
ALTER TABLE public.achievements
  DROP CONSTRAINT IF EXISTS achievements_user_id_achievement_type_key;

ALTER TABLE public.achievements
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS achievement_type,
  DROP COLUMN IF EXISTS unlocked_at,
  ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_sv TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_sv TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- Everyone can read the achievement catalog
DROP POLICY IF EXISTS "Anyone can view achievements catalog" ON public.achievements;
CREATE POLICY "Anyone can view achievements catalog" ON public.achievements
  FOR SELECT USING (true);

-- ============================================
-- 3. Create user_achievements table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  cycle_number INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, achievement_id, cycle_number)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own earned achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Index (the one referenced in 20260201 performance migration)
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- ============================================
-- 4. Achievement cycles table
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievement_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, cycle_number)
);

ALTER TABLE public.achievement_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cycles" ON public.achievement_cycles
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 5. Seed achievement catalog
-- ============================================
INSERT INTO public.achievements (code, category, name_en, name_sv, description_en, description_sv, icon, points)
VALUES
  ('profile_complete', 'profile', 'Profile Master', 'Profilmästare', 'Complete your profile', 'Fyll i din profil helt', '👤', 10),
  ('first_match', 'matching', 'First Match', 'Första matchningen', 'Get your first match', 'Få din första match', '💕', 20),
  ('first_message', 'chat', 'Icebreaker', 'Isbrytare', 'Send your first message', 'Skicka ditt första meddelande', '💬', 15),
  ('personality_test', 'personality', 'Self-Awareness', 'Självkännedom', 'Complete the personality test', 'Genomför personlighetstestet', '🧠', 25),
  ('photo_upload', 'profile', 'Photogenic', 'Fotogen', 'Upload a profile photo', 'Ladda upp ett profilfoto', '📷', 10),
  ('weekly_active', 'social', 'Weekly Active', 'Veckoaktiv', 'Log in every day for a week', 'Logga in varje dag i en vecka', '🔥', 30),
  ('conversation_starter', 'chat', 'Conversation Starter', 'Konversationsstartare', 'Start 5 conversations', 'Starta 5 konversationer', '🗣️', 25),
  ('perfect_match', 'matching', 'Perfect Match', 'Perfekt Match', 'Get a match with 95%+ compatibility', 'Få en match med 95%+ kompatibilitet', '💯', 50),
  ('id_verified', 'profile', 'Verified', 'Verifierad', 'Verify your identity with ID', 'Verifiera din identitet med ID', '🪪', 15),
  ('daily_icebreaker', 'chat', 'The Icebreaker', 'Isbrytaren', 'Send an AI icebreaker to a match', 'Skicka en AI-isbrytare till en matchning', '❄️', 10),
  ('group_creator', 'social', 'The Gatherer', 'Samlaren', 'Create your first samlingsgrupp', 'Skapa din första samlingsgrupp', '🌿', 20),
  ('group_joiner', 'social', 'Fellow Traveler', 'Medresenären', 'Join 3 samlingsgrupper', 'Gå med i 3 samlingsgrupper', '🤝', 15),
  ('deep_conversation', 'chat', 'Deep Diver', 'Djupdykaren', 'Have a conversation with 20+ messages', 'Ha en konversation med 20+ meddelanden', '🌊', 25),
  ('weekly_matcher', 'matching', 'Weekly Matcher', 'Veckomatcharen', 'Receive matches 7 days in a row', 'Få matchningar 7 dagar i rad', '📅', 30),
  ('personality_explorer', 'personality', 'Personality Guide', 'Personlighetsguiden', 'Read about all 4 personality categories', 'Läs om alla 4 personlighetskategorier', '🧭', 15),
  ('photo_pro', 'profile', 'Photo Pro', 'Fotoproffset', 'Upload 4+ profile photos', 'Ladda upp 4+ profilfoton', '📸', 10),
  ('sunday_rematcher', 'matching', 'Sunday Hero', 'Söndagshjälten', 'Use Sunday Rematch and chat with a match', 'Använd söndagsmatchning och chatta med en match', '☀️', 20),
  ('bio_writer', 'profile', 'The Storyteller', 'Berättaren', 'Write a bio with 100+ characters', 'Skriv en bio med 100+ tecken', '✍️', 10),
  ('multi_chatter', 'chat', 'Chat Champion', 'Samtalsmästaren', 'Have active chats with 5+ matches', 'Ha aktiva chattar med 5+ matchningar', '💬', 25)
ON CONFLICT (code) DO NOTHING;
