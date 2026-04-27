-- Lägg till country på profiles för bulk-utskick (filter på land)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country varchar(2);

COMMENT ON COLUMN public.profiles.country IS 'ISO 3166-1 alpha-2 (t.ex. SE, NO, DK) för segmentering av bulk-e-post.';

CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country) WHERE country IS NOT NULL;
