-- Complete Schema Setup for New Supabase Project
-- This migration creates all tables from scratch

-- ============================================
-- 1. PROFILES TABLE (Base user information)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  date_of_birth DATE,
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  gender TEXT,
  looking_for TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add display_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (drop existing first)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. PERSONALITY SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.personality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  openness DECIMAL(5,2) NOT NULL,
  conscientiousness DECIMAL(5,2) NOT NULL,
  extraversion DECIMAL(5,2) NOT NULL,
  agreeableness DECIMAL(5,2) NOT NULL,
  neuroticism DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.personality_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scores" ON public.personality_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores" ON public.personality_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores" ON public.personality_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 3. DEALBREAKERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.dealbreakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  min_age INT,
  max_age INT,
  max_distance_km INT,
  gender_preferences TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.dealbreakers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own dealbreakers" ON public.dealbreakers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dealbreakers" ON public.dealbreakers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dealbreakers" ON public.dealbreakers
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 4. MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(5,2) NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'liked', 'disliked', 'mutual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, matched_user_id)
);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can insert their own matches" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches" ON public.matches
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to view profiles of their matches
CREATE POLICY "Users can view profiles of their matches" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE (matches.user_id = auth.uid() AND matches.matched_user_id = profiles.id)
         OR (matches.matched_user_id = auth.uid() AND matches.user_id = profiles.id)
    )
  );

-- ============================================
-- 5. MESSAGES TABLE (Realtime chat)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
      AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages to their matches" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = match_id
      AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
    )
  );

CREATE POLICY "Senders can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- SECURITY DEFINER function for recipients to mark messages as read
CREATE OR REPLACE FUNCTION public.update_message_read_at(message_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify the caller is a participant in the match
  IF EXISTS (
    SELECT 1 FROM public.messages m
    INNER JOIN public.matches mt ON m.match_id = mt.id
    WHERE m.id = message_id
    AND (mt.user_id = auth.uid() OR mt.matched_user_id = auth.uid())
  ) THEN
    UPDATE public.messages
    SET read_at = now()
    WHERE id = message_id;
  ELSE
    RAISE EXCEPTION 'Not authorized to update this message';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================
-- 6. ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT policy - achievements must be granted via grant_achievement function

CREATE POLICY "Users can update their own achievements" ON public.achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- SECURITY DEFINER function to grant achievements with server-side validation
-- This function should only be called by Edge Functions or backend services using service role
-- Users cannot grant achievements to themselves
CREATE OR REPLACE FUNCTION public.grant_achievement(
  target_user_id UUID,
  achievement_type TEXT
)
RETURNS UUID AS $$
DECLARE
  new_achievement_id UUID;
  valid_achievement BOOLEAN := FALSE;
BEGIN
  -- Enforce authorization: only allow if caller has service_role or is a privileged function
  -- Regular authenticated users cannot call this function
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: only service role can grant achievements';
  END IF;
  
  -- Server-side validation: check achievement_type is valid
  -- Define valid achievement types
  valid_achievement := achievement_type IN (
    'first_match',
    'first_chat',
    'profile_complete',
    'verified_phone',
    'personality_complete',
    'ten_matches',
    'fifty_matches',
    'hundred_matches',
    'daily_streak_7',
    'daily_streak_30',
    'early_adopter'
  );
  
  IF NOT valid_achievement THEN
    RAISE EXCEPTION 'Invalid achievement_type: %', achievement_type;
  END IF;
  
  -- TODO: Add additional unlock condition validation here
  -- Example: Check if user actually has 10 matches before granting 'ten_matches'
  -- This prevents arbitrary achievement grants
  
  -- Insert achievement
  INSERT INTO public.achievements (user_id, achievement_type)
  VALUES (target_user_id, achievement_type)
  ON CONFLICT (user_id, achievement_type) DO NOTHING
  RETURNING id INTO new_achievement_id;
  
  -- Handle ON CONFLICT case: if insert was skipped, fetch existing id
  IF new_achievement_id IS NULL THEN
    SELECT id INTO new_achievement_id
    FROM public.achievements
    WHERE user_id = target_user_id AND achievement_type = grant_achievement.achievement_type;
  END IF;
  
  -- Secure audit logging (no RAISE NOTICE to avoid leaking identifiers)
  -- TODO: Insert into audit table if needed
  
  RETURN new_achievement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Do NOT grant execute to authenticated - only service role should call this
-- Edge Functions using service role key will have access
-- REVOKE EXECUTE ON FUNCTION public.grant_achievement FROM authenticated;
-- REVOKE EXECUTE ON FUNCTION public.grant_achievement FROM anon;

-- ============================================
-- 7. SUBSCRIPTIONS TABLE (Premium features)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium', 'vip')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their subscription, not create or modify
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT or UPDATE policies - subscriptions must be managed server-side
-- Use Edge Functions or backend with service role key to create/update subscriptions

-- ============================================
-- 8. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 9. PUSH SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 10. BATCH MATCHING SYSTEM TABLES
-- ============================================

-- User Daily Match Pools
CREATE TABLE IF NOT EXISTS public.user_daily_match_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pool_date DATE NOT NULL DEFAULT CURRENT_DATE,
  candidates_data JSONB NOT NULL,
  is_delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, pool_date)
);

-- Enable RLS
ALTER TABLE public.user_daily_match_pools ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pools" ON public.user_daily_match_pools
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pools" ON public.user_daily_match_pools
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pools" ON public.user_daily_match_pools
  FOR UPDATE USING (auth.uid() = user_id);

-- User Match Delivery Status
CREATE TABLE IF NOT EXISTS public.user_match_delivery_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_delivered_date DATE,
  next_available_date DATE,
  timezone TEXT DEFAULT 'Europe/Stockholm',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_match_delivery_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own delivery status" ON public.user_match_delivery_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own delivery status" ON public.user_match_delivery_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own delivery status" ON public.user_match_delivery_status
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 11. GDPR COMPLIANCE TABLES
-- ============================================

-- Consents Table
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms_of_service', 'privacy_policy', 'data_processing', 'marketing', 'third_party_sharing')),
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own consents" ON public.consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents" ON public.consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents" ON public.consents
  FOR UPDATE USING (auth.uid() = user_id);

-- Privacy Settings Table
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_online_status BOOLEAN DEFAULT true,
  show_read_receipts BOOLEAN DEFAULT true,
  show_typing_indicator BOOLEAN DEFAULT true,
  allow_analytics BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own privacy settings" ON public.privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings" ON public.privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings" ON public.privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 12. TRIGGERS & FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personality_scores_updated_at
  BEFORE UPDATE ON public.personality_scores
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dealbreakers_updated_at
  BEFORE UPDATE ON public.dealbreakers
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_match_delivery_status_updated_at
  BEFORE UPDATE ON public.user_match_delivery_status
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consents_updated_at
  BEFORE UPDATE ON public.consents
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create privacy settings on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER on_profile_created_privacy_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_privacy_settings();

-- Auto-create match delivery status on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_delivery_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_match_delivery_status (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER on_profile_created_delivery_status
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_delivery_status();

-- ============================================
-- 13. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON public.matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_match_pools_user_date ON public.user_daily_match_pools(user_id, pool_date);
CREATE INDEX IF NOT EXISTS idx_user_match_delivery_status_user_id ON public.user_match_delivery_status(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_user_id ON public.consents(user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
