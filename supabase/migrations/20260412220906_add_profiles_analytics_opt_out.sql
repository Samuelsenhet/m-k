-- Add analytics_opt_out flag to profiles
-- Controls whether PostHog captures events for this user.
-- Toggled via the "Delad data" screen in mobile Privacy Controls.

alter table public.profiles
  add column if not exists analytics_opt_out boolean not null default false;

comment on column public.profiles.analytics_opt_out is
  'When true, PostHog analytics are disabled for this user. Controlled via "Delad data" screen in Privacy Controls.';
