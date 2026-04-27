ALTER TABLE public.waitlist_signups
  ADD COLUMN notified_at timestamptz NULL;

CREATE INDEX idx_waitlist_signups_notified_at
  ON public.waitlist_signups (notified_at)
  WHERE notified_at IS NULL;
