-- Moderator roles: users who can see and update all reports
CREATE TABLE IF NOT EXISTS public.moderator_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.moderator_roles ENABLE ROW LEVEL SECURITY;

-- Only existing moderators can read the list (for "am I moderator?" check)
CREATE POLICY "Moderators can read moderator_roles"
ON public.moderator_roles FOR SELECT
USING (auth.uid() = user_id);

-- Reports: allow moderators to select all and update status
CREATE POLICY "Moderators can select all reports"
ON public.reports FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Moderators can update reports"
ON public.reports FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid())
);

-- Appeals table (Överklagande): user appeals against a sanction
CREATE TABLE IF NOT EXISTS public.appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appeals_user ON public.appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.appeals(status);

ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own appeals"
ON public.appeals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own appeals"
ON public.appeals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Moderators can select all appeals"
ON public.appeals FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Moderators can update appeals"
ON public.appeals FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.moderator_roles WHERE user_id = auth.uid())
);

-- Trigger: notify reporter when report status changes
CREATE OR REPLACE FUNCTION public.notify_reporter_on_report_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg_title text;
  msg_body text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    msg_title := 'Rapportuppdatering';
    msg_body := CASE NEW.status
      WHEN 'reviewing' THEN 'Din rapport granskas.'
      WHEN 'resolved' THEN 'Din rapport har avslutats.'
      WHEN 'dismissed' THEN 'Din rapport har avslagits.'
      ELSE 'Din rapport har uppdaterats.'
    END;
    INSERT INTO public.notifications (user_id, title, body, type, read, data)
    VALUES (
      OLD.reporter_id,
      msg_title,
      msg_body,
      'info',
      false,
      jsonb_build_object('report_id', OLD.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_reporter_on_report_status_trigger ON public.reports;
CREATE TRIGGER notify_reporter_on_report_status_trigger
  AFTER UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_reporter_on_report_status();

-- Appeals updated_at trigger
CREATE OR REPLACE FUNCTION public.set_appeals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appeals_updated_at ON public.appeals;
CREATE TRIGGER appeals_updated_at
  BEFORE UPDATE ON public.appeals
  FOR EACH ROW EXECUTE FUNCTION public.set_appeals_updated_at();
