-- Create achievements definition table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_sv TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_sv TEXT NOT NULL,
  description_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  points INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by everyone (definitions)
CREATE POLICY "Anyone can view achievement definitions"
ON public.achievements FOR SELECT
USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert achievements (triggered by app logic)
CREATE POLICY "Service can insert user achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (code, name_sv, name_en, description_sv, description_en, icon, points, category) VALUES
('profile_complete', 'Profil Komplett', 'Profile Complete', 'Fyllde i alla profilfält', 'Completed all profile fields', 'user-check', 50, 'profile'),
('first_photo', 'Första Bilden', 'First Photo', 'Laddade upp ditt första foto', 'Uploaded your first photo', 'camera', 10, 'profile'),
('photos_complete', 'Fotogalleri', 'Photo Gallery', 'Laddade upp alla 6 foton', 'Uploaded all 6 photos', 'images', 30, 'profile'),
('personality_test', 'Självinsikt', 'Self-Awareness', 'Avslutade personlighetstestet', 'Completed the personality test', 'brain', 25, 'personality'),
('first_match', 'Första Gnistan', 'First Spark', 'Fick din första matchning', 'Got your first match', 'heart', 15, 'matching'),
('first_mutual', 'Ömsesidig Attraktion', 'Mutual Attraction', 'Fick din första ömsesidiga matchning', 'Got your first mutual match', 'hearts', 25, 'matching'),
('first_message', 'Isbrytare', 'Ice Breaker', 'Skickade ditt första meddelande', 'Sent your first message', 'message-circle', 15, 'social'),
('week_streak', 'Hängiven', 'Dedicated', 'Använde appen 7 dagar i rad', 'Used the app 7 days in a row', 'flame', 50, 'engagement'),
('ten_matches', 'Populär', 'Popular', 'Fick 10 matchningar', 'Got 10 matches', 'trending-up', 35, 'matching'),
('conversation_starter', 'Konversationsmästare', 'Conversation Master', 'Startade 5 konversationer', 'Started 5 conversations', 'message-square', 30, 'social');

-- Create index for efficient queries
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_achievements_category ON public.achievements(category);