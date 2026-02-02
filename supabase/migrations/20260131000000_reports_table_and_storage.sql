-- Reports table: user-submitted reports per Rapporterings hanteringsplan
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  context text NOT NULL CHECK (context IN ('profile', 'chat', 'general')),
  violation_type text NOT NULL,
  description text NOT NULL,
  evidence_paths text[] DEFAULT '{}',
  witness_statement text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reporters can insert their own reports
CREATE POLICY "Users can insert own reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Reporters can read their own reports
CREATE POLICY "Users can read own reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

-- No update/delete for reporters (moderation only via service role)

-- Report evidence storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-evidence',
  'report-evidence',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- Users can upload to their own report folder: {reporter_id}/{report_id}/{filename}
CREATE POLICY "Users can upload report evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'report-evidence'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own report evidence
CREATE POLICY "Users can read own report evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'report-evidence'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_reports_updated_at();
