-- email_logs: template_id för koppling till email_templates
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL;

-- Tillåt status 'pending' (används före utskick för tracking-pixel)
ALTER TABLE public.email_logs DROP CONSTRAINT IF EXISTS email_logs_status_check;
ALTER TABLE public.email_logs ADD CONSTRAINT email_logs_status_check CHECK (status IN ('pending', 'sent', 'failed', 'bounced'));

-- bulk_emails: results för att spara utskicksresultat
ALTER TABLE public.bulk_emails ADD COLUMN IF NOT EXISTS results jsonb;
