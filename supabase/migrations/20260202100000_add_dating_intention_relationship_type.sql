-- Dejtingavsikter & Relationstyper (Grundläggande)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dating_intention TEXT,
  ADD COLUMN IF NOT EXISTS dating_intention_extra TEXT,
  ADD COLUMN IF NOT EXISTS relationship_type TEXT,
  ADD COLUMN IF NOT EXISTS relationship_type_extra TEXT;
