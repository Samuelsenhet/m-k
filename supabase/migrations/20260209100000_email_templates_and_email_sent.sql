-- E-postmallar för ärendehantering (rapporter, överklaganden)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  subject_sv text NOT NULL,
  body_sv text NOT NULL,
  subject_en text,
  body_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Spåra om bekräftelse e-post skickats för rapport/överklagande
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
ALTER TABLE public.appeals ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;

-- Logg över skickade e-postmeddelanden (för admin-panelen)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  template_name varchar(100),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  appeal_id uuid REFERENCES public.appeals(id) ON DELETE SET NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Endast moderatorer (eller service role) kan läsa e-postloggar
CREATE POLICY "Moderators can read email_logs"
ON public.email_logs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid())
);

-- Endast Edge Functions (service role) får inserta
-- RLS tillåter ingen användar-insert; använd service role i send-email-funktionen

-- Standardmallar (kan överskrivas via admin senare)
INSERT INTO public.email_templates (name, subject_sv, body_sv, subject_en, body_en)
VALUES
  (
    'report_received',
    'Din rapport har mottagits – Määk',
    '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Tack för din rapport</h2><p>Vi har mottagit din säkerhetsrapport.</p><p>Vi granskar den och återkommer inom 24–72 timmar.</p><p>Referens: {{report_id}}</p><hr><small>Määk Safety Team</small></div>',
    'Your report has been received – Määk',
    '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Thank you for your report</h2><p>We have received your safety report.</p><p>We will review it and get back to you within 24–72 hours.</p><p>Reference: {{report_id}}</p><hr><small>Määk Safety Team</small></div>'
  ),
  (
    'report_resolved',
    'Din rapport har hanterats – Määk',
    '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Rapport avslutad</h2><p>Din rapport har granskats och avslutats.</p><p>Status: {{status}}</p><hr><small>Määk Safety Team</small></div>',
    'Your report has been resolved – Määk',
    '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Report resolved</h2><p>Your report has been reviewed and closed.</p><p>Status: {{status}}</p><hr><small>Määk Safety Team</small></div>'
  ),
  (
    'appeal_received',
    'Ditt överklagande har mottagits – Määk',
    '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Tack för ditt överklagande</h2><p>Vi har mottagit ditt ärende.</p><p>Vi granskar det och återkommer inom 72 timmar.</p><p>Referens: {{appeal_id}}</p><hr><small>Määk Team</small></div>',
    'Your appeal has been received – Määk',
    '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Thank you for your appeal</h2><p>We have received your case.</p><p>We will review it and get back to you within 72 hours.</p><p>Reference: {{appeal_id}}</p><hr><small>Määk Team</small></div>'
  ),
  (
    'appeal_decision',
    'Beslut på ditt överklagande – Määk',
    '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Beslut</h2><p>Ditt överklagande har behandlats.</p><p>Resultat: {{status}}</p><hr><small>Määk Team</small></div>',
    'Decision on your appeal – Määk',
    '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Decision</h2><p>Your appeal has been processed.</p><p>Outcome: {{status}}</p><hr><small>Määk Team</small></div>'
  )
ON CONFLICT (name) DO NOTHING;

-- Trigger för email_templates updated_at
CREATE OR REPLACE FUNCTION public.set_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_templates_updated_at ON public.email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_email_templates_updated_at();
