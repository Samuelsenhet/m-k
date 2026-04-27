CREATE TABLE public.waitlist_signups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  source     text NOT NULL DEFAULT 'landing_vanta',
  CONSTRAINT waitlist_signups_email_source_unique UNIQUE (email, source)
);

CREATE INDEX idx_waitlist_signups_source ON public.waitlist_signups (source);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
