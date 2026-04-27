-- Punkt 3: Admin-panel för e-post – utökad struktur

-- 1. Utöka email_templates
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS category varchar(50) DEFAULT 'system';
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS variables text[] DEFAULT '{}';
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS last_used timestamptz;

-- 2. bulk_emails för framtida bulk-utskick/schemaläggning
CREATE TABLE IF NOT EXISTS public.bulk_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  filters jsonb,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bulk_emails_status ON public.bulk_emails(status);
CREATE INDEX IF NOT EXISTS idx_bulk_emails_created ON public.bulk_emails(created_at DESC);

ALTER TABLE public.bulk_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can manage bulk_emails"
ON public.bulk_emails FOR ALL
USING (EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid()));

-- 3. Utöka email_logs
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS campaign_id uuid;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS opened_at timestamptz;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS clicked_at timestamptz;

-- 4. RLS på email_templates så moderatorer kan läsa och redigera
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderators can read email_templates" ON public.email_templates;
CREATE POLICY "Moderators can read email_templates"
ON public.email_templates FOR SELECT
USING (EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Moderators can insert email_templates" ON public.email_templates;
CREATE POLICY "Moderators can insert email_templates"
ON public.email_templates FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Moderators can update email_templates" ON public.email_templates;
CREATE POLICY "Moderators can update email_templates"
ON public.email_templates FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Moderators can delete email_templates" ON public.email_templates;
CREATE POLICY "Moderators can delete email_templates"
ON public.email_templates FOR DELETE
USING (EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid()));

-- Uppdatera befintliga mallar med category (system/reports/appeals)
UPDATE public.email_templates SET category = 'reports' WHERE name IN ('report_received', 'report_resolved');
UPDATE public.email_templates SET category = 'appeals' WHERE name IN ('appeal_received', 'appeal_decision');

-- Trigger bulk_emails updated_at
CREATE OR REPLACE FUNCTION public.set_bulk_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bulk_emails_updated_at ON public.bulk_emails;
CREATE TRIGGER bulk_emails_updated_at
  BEFORE UPDATE ON public.bulk_emails
  FOR EACH ROW EXECUTE FUNCTION public.set_bulk_emails_updated_at();
