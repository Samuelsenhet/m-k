-- Add is_visible flag to profiles
-- Controls whether a user appears in other users' daily match pools.
-- Toggled via the Synlighet switch in mobile Privacy Controls.

alter table public.profiles
  add column if not exists is_visible boolean not null default true;

comment on column public.profiles.is_visible is
  'When false, profile is excluded from daily match pool generation. User-controlled via Synlighet toggle in Privacy Controls.';
