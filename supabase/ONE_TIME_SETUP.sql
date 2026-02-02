-- =============================================================================
-- MÄÄK ONE-TIME SETUP – Run this in Supabase Dashboard → SQL Editor
-- Fixes: 400 on profiles, 404 on personality_results, "Bucket not found" on uploads
-- =============================================================================

-- 1. STORAGE BUCKET (fixes "Bucket not found" / 400 on profile-photos upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;

CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 1b. ID DOCUMENTS BUCKET (private – for government ID verification)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Users can upload own id documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own id documents" ON storage.objects;
CREATE POLICY "Users can upload own id documents" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own id documents" ON storage.objects FOR SELECT
USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. PERSONALITY_RESULTS (fixes 404)
CREATE TABLE IF NOT EXISTS public.personality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scores JSONB NOT NULL DEFAULT '{}',
  archetype VARCHAR(4),
  category VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_personality UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_personality_results_user_id ON public.personality_results(user_id);
ALTER TABLE public.personality_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own personality results" ON public.personality_results;
DROP POLICY IF EXISTS "Users can insert their own personality results" ON public.personality_results;
DROP POLICY IF EXISTS "Users can update their own personality results" ON public.personality_results;
DROP POLICY IF EXISTS "Users can delete their own personality results" ON public.personality_results;

CREATE POLICY "Users can view their own personality results" ON public.personality_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own personality results" ON public.personality_results FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own personality results" ON public.personality_results FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own personality results" ON public.personality_results FOR DELETE USING (user_id = auth.uid());

-- 3. PROFILE_PHOTOS
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id);
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.profile_photos;

CREATE POLICY "Users can view their own photos" ON public.profile_photos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own photos" ON public.profile_photos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own photos" ON public.profile_photos FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own photos" ON public.profile_photos FOR DELETE USING (user_id = auth.uid());

-- 4. PROFILES: ensure user_id column exists (fixes 400 on profiles select)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
  END IF;
END $$;

-- 5. PROFILES: add missing columns (fixes PGRST204 "Could not find 'alcohol' column")
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'alcohol') THEN
    ALTER TABLE public.profiles ADD COLUMN alcohol TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'smoking') THEN
    ALTER TABLE public.profiles ADD COLUMN smoking TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'religion') THEN
    ALTER TABLE public.profiles ADD COLUMN religion TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'politics') THEN
    ALTER TABLE public.profiles ADD COLUMN politics TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pronouns') THEN
    ALTER TABLE public.profiles ADD COLUMN pronouns TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_completion') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_completion INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_age') THEN
    ALTER TABLE public.profiles ADD COLUMN show_age BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_job') THEN
    ALTER TABLE public.profiles ADD COLUMN show_job BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_education') THEN
    ALTER TABLE public.profiles ADD COLUMN show_education BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_last_name') THEN
    ALTER TABLE public.profiles ADD COLUMN show_last_name BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'interested_in') THEN
    ALTER TABLE public.profiles ADD COLUMN interested_in TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'sexuality') THEN
    ALTER TABLE public.profiles ADD COLUMN sexuality TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'min_age') THEN
    ALTER TABLE public.profiles ADD COLUMN min_age INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'max_age') THEN
    ALTER TABLE public.profiles ADD COLUMN max_age INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'max_distance') THEN
    ALTER TABLE public.profiles ADD COLUMN max_distance INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hometown') THEN
    ALTER TABLE public.profiles ADD COLUMN hometown TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'work') THEN
    ALTER TABLE public.profiles ADD COLUMN work TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'height') THEN
    ALTER TABLE public.profiles ADD COLUMN height INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'education') THEN
    ALTER TABLE public.profiles ADD COLUMN education TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'instagram') THEN
    ALTER TABLE public.profiles ADD COLUMN instagram TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'linkedin') THEN
    ALTER TABLE public.profiles ADD COLUMN linkedin TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_verification_status') THEN
    ALTER TABLE public.profiles ADD COLUMN id_verification_status TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_verification_submitted_at') THEN
    ALTER TABLE public.profiles ADD COLUMN id_verification_submitted_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_document_front_path') THEN
    ALTER TABLE public.profiles ADD COLUMN id_document_front_path TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_document_back_path') THEN
    ALTER TABLE public.profiles ADD COLUMN id_document_back_path TEXT;
  END IF;
END $$;

-- 6. PROFILES RLS: allow select by user_id or id
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile or matches" ON public.profiles;
CREATE POLICY "Users can view their own profile or matches" ON public.profiles FOR SELECT
USING (
  id = auth.uid() OR user_id = auth.uid()
  OR id IN (
    SELECT matched_user_id FROM public.matches WHERE user_id = auth.uid()
    UNION
    SELECT user_id FROM public.matches WHERE matched_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE
USING (id = auth.uid() OR user_id = auth.uid())
WITH CHECK (id = auth.uid() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE
USING (id = auth.uid() OR user_id = auth.uid());

-- 7. ACHIEVEMENTS (definition) + USER_ACHIEVEMENTS (fixes 404 "Could not find table user_achievements")
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    CREATE TABLE public.achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_sv TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_sv TEXT NOT NULL,
      icon TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO public.achievements (code, category, name_en, name_sv, description_en, description_sv, icon, points)
    VALUES
      ('profile_complete','profile','Profile Master','Profilmästare','Complete your profile','Fyll i din profil helt','👤',10),
      ('first_match','matching','First Match','Första matchningen','Get your first match','Få din första match','💕',20),
      ('first_message','chat','Icebreaker','Isbrytare','Send your first message','Skicka ditt första meddelande','💬',15),
      ('personality_test','personality','Self-Awareness','Självkännedom','Complete the personality test','Genomför personlighetstestet','🧠',25),
      ('photo_upload','profile','Photogenic','Fotogen','Upload a profile photo','Ladda upp ett profilfoto','📷',10),
      ('weekly_active','social','Weekly Active','Veckoaktiv','Log in every day for a week','Logga in varje dag i en vecka','🔥',30),
      ('conversation_starter','chat','Conversation Starter','Konversationsstartare','Start 5 conversations','Starta 5 konversationer','🗣️',25),
      ('perfect_match','matching','Perfect Match','Perfekt Match','Get a match with 95%+ compatibility','Få en match med 95%+ kompatibilitet','💯',50);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'code') THEN
    INSERT INTO public.achievements (code, category, name_en, name_sv, description_en, description_sv, icon, points)
    VALUES
      ('profile_complete','profile','Profile Master','Profilmästare','Complete your profile','Fyll i din profil helt','👤',10),
      ('first_match','matching','First Match','Första matchningen','Get your first match','Få din första match','💕',20),
      ('first_message','chat','Icebreaker','Isbrytare','Send your first message','Skicka ditt första meddelande','💬',15),
      ('personality_test','personality','Self-Awareness','Självkännedom','Complete the personality test','Genomför personlighetstestet','🧠',25),
      ('photo_upload','profile','Photogenic','Fotogen','Upload a profile photo','Ladda upp ett profilfoto','📷',10),
      ('weekly_active','social','Weekly Active','Veckoaktiv','Log in every day for a week','Logga in varje dag i en vecka','🔥',30),
      ('conversation_starter','chat','Conversation Starter','Konversationsstartare','Start 5 conversations','Starta 5 konversationer','🗣️',25),
      ('perfect_match','matching','Perfect Match','Perfekt Match','Get a match with 95%+ compatibility','Få en match med 95%+ kompatibilitet','💯',50),
      ('id_verified','profile','Verified','Verifierad','Verify your identity with ID','Verifiera din identitet med ID','🪪',15)
    ON CONFLICT (code) DO NOTHING;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own user_achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert their own user_achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own user_achievements" ON public.user_achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own user_achievements" ON public.user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. ID VERIFICATION PROVIDER MAPPING (for Onfido/Jumio webhooks: applicant_id -> user_id)
CREATE TABLE IF NOT EXISTS public.id_verification_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, applicant_id)
);
CREATE INDEX IF NOT EXISTS idx_id_verification_applicants_user_id ON public.id_verification_applicants(user_id);
CREATE INDEX IF NOT EXISTS idx_id_verification_applicants_provider_applicant ON public.id_verification_applicants(provider, applicant_id);
ALTER TABLE public.id_verification_applicants ENABLE ROW LEVEL SECURITY;
-- Only service role / backend should insert; webhook reads by applicant_id (no RLS on service role)
DROP POLICY IF EXISTS "Users can view own id verification applicant" ON public.id_verification_applicants;
CREATE POLICY "Users can view own id verification applicant" ON public.id_verification_applicants FOR SELECT USING (user_id = auth.uid());
