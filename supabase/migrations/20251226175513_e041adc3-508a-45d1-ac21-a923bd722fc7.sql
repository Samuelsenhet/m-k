-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

-- Create RLS policies for profile photos bucket
CREATE POLICY "Anyone can view profile photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table for storing photo metadata (ordering, prompts)
CREATE TABLE public.profile_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile_photos
CREATE POLICY "Anyone can view profile photos metadata" 
ON public.profile_photos 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own photos" 
ON public.profile_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos" 
ON public.profile_photos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" 
ON public.profile_photos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_profile_photos_user_id ON public.profile_photos(user_id);
CREATE INDEX idx_profile_photos_order ON public.profile_photos(user_id, display_order);

-- Add archetype column to personality_results for 16 archetypes
ALTER TABLE public.personality_results ADD COLUMN IF NOT EXISTS archetype TEXT;

-- Create table for AI-generated icebreakers
CREATE TABLE public.icebreakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  icebreaker_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for icebreakers
ALTER TABLE public.icebreakers ENABLE ROW LEVEL SECURITY;

-- RLS policies for icebreakers
CREATE POLICY "Users can view icebreakers for their matches" 
ON public.icebreakers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = icebreakers.match_id 
    AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
  )
);

CREATE POLICY "Users can update icebreakers for their matches" 
ON public.icebreakers 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = icebreakers.match_id 
    AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
  )
);

-- Create index for icebreakers
CREATE INDEX idx_icebreakers_match_id ON public.icebreakers(match_id);