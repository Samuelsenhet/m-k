-- last_daily_matches: per-user daily dedup list used by match-daily upsert.
-- Tidigare definierad endast i supabase/RLS_AND_SCHEMA_ALIGNMENT.sql och
-- applicerad manuellt mot prod. Promoteras nu till en riktig migration så
-- schemat går att återskapa i preview-branches och nya miljöer.

create table if not exists public.last_daily_matches (
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  match_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.last_daily_matches enable row level security;

-- Defensiv policy. match-daily gör själva upserten via service_role (som
-- bypassar RLS ändå), men om en klient någonsin läser sin egen rad direkt
-- ska det fungera — och inte mer än så.
drop policy if exists "Users can manage own last_daily_matches"
  on public.last_daily_matches;

create policy "Users can manage own last_daily_matches"
  on public.last_daily_matches
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Säkerställ att prestandaindex från 20260201013200 finns även i fresh miljöer.
create index if not exists idx_last_daily_matches_user_id
  on public.last_daily_matches (user_id);

comment on table public.last_daily_matches is
  'Per-user daily dedup list för match-daily. Upsertas av service_role i edge-funktionen.';
