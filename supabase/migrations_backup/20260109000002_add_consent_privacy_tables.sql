-- Migration: Add consent and privacy tables for GDPR compliance
-- Date: 2026-01-09
-- Description: Creates tables for user consent tracking and privacy settings

-- 1. Consents Table
-- Tracks user consent for various data processing activities (GDPR requirement)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'terms_of_service', 'privacy_policy', 'marketing', 'data_processing'
  consented BOOLEAN NOT NULL DEFAULT false,
  consented_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  ip_address INET, -- Track IP for legal compliance
  user_agent TEXT, -- Track device/browser for audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, consent_type)
);

-- Indexes for quick lookups
CREATE INDEX idx_consents_user_id ON public.consents(user_id);
CREATE INDEX idx_consents_type ON public.consents(consent_type);
CREATE INDEX idx_consents_user_type ON public.consents(user_id, consent_type);

-- Enable RLS
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own consents"
  ON public.consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON public.consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON public.consents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Privacy Settings Table
-- Stores user's privacy preferences and visibility controls
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Profile visibility
  profile_visible BOOLEAN NOT NULL DEFAULT true,
  show_age BOOLEAN NOT NULL DEFAULT true,
  show_location BOOLEAN NOT NULL DEFAULT true,
  show_last_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Matching preferences
  discoverable BOOLEAN NOT NULL DEFAULT true, -- Can be shown in match pools
  
  -- Communication preferences
  allow_messages_from TEXT NOT NULL DEFAULT 'matches', -- 'matches', 'everyone', 'none'
  read_receipts_enabled BOOLEAN NOT NULL DEFAULT true,
  typing_indicators_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Notifications (separate from push notification settings)
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  match_notifications BOOLEAN NOT NULL DEFAULT true,
  message_notifications BOOLEAN NOT NULL DEFAULT true,
  
  -- Data sharing
  share_analytics BOOLEAN NOT NULL DEFAULT true,
  share_for_research BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick user lookups
CREATE INDEX idx_privacy_settings_user_id ON public.privacy_settings(user_id);

-- Enable RLS
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own privacy settings"
  ON public.privacy_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
  ON public.privacy_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
  ON public.privacy_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Add onboarding_completed_at to profiles for 24-hour wait enforcement
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- 4. Function to auto-create default privacy settings on user signup
CREATE OR REPLACE FUNCTION public.create_default_privacy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Trigger to create privacy settings when profile is created
CREATE TRIGGER on_profile_created_privacy
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_privacy_settings();

-- 6. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_privacy_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 7. Triggers for updated_at
CREATE TRIGGER set_consents_updated_at
  BEFORE UPDATE ON public.consents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_privacy_updated_at();

CREATE TRIGGER set_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_privacy_updated_at();

-- 8. Seed required consents for existing users (one-time operation)
-- This ensures all existing users have consent records
INSERT INTO public.consents (user_id, consent_type, consented, consented_at)
SELECT 
  id,
  consent_type,
  true, -- Assume existing users consented (grandfather clause)
  created_at
FROM auth.users
CROSS JOIN (
  VALUES 
    ('terms_of_service'),
    ('privacy_policy'),
    ('data_processing')
) AS ct(consent_type)
ON CONFLICT (user_id, consent_type) DO NOTHING;

-- 9. Comment for documentation
COMMENT ON TABLE public.consents IS 'Tracks user consent for GDPR compliance. Each user must have consented to terms_of_service, privacy_policy, and data_processing before using the app.';
COMMENT ON TABLE public.privacy_settings IS 'User privacy preferences and visibility controls. Created automatically when user signs up with sensible defaults.';
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Timestamp when user completed onboarding. Used to enforce 24-hour waiting period before first matches.';
