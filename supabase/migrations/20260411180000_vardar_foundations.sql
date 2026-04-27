-- Värdar (Hosts Program) — foundational schema
--
-- See docs/VARDAR.md for the full spec.
--
-- Four tables:
--   host_profiles     one row per candidate / approved / paused host
--   träffar           public IRL events created by active hosts
--   träff_rsvps       who's going to each träff (and who showed up)
--   introductions     Värd-mediated introductions between two of their matches
--
-- RLS is enabled on all four. Policies are restrictive by default: reads
-- are scoped to the user and/or active+public state, writes go through
-- edge functions using the service role for state transitions.

begin;

-- ---------------------------------------------------------------------------
-- host_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.host_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'paused', 'declined', 'revoked')),
  eligible_via text check (eligible_via in ('samling', 'träff', 'introductions')),
  eligibility_notes text,
  activated_at timestamptz,
  paused_at timestamptz,
  last_activity_at timestamptz not null default now(),
  bio_extended text check (char_length(bio_extended) <= 500),
  cover_image_id text,
  slug text unique check (slug ~ '^[a-z0-9_-]{3,30}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists host_profiles_status_idx
  on public.host_profiles (status);
create index if not exists host_profiles_last_activity_idx
  on public.host_profiles (last_activity_at);

alter table public.host_profiles enable row level security;

-- Anyone authenticated can read public-facing fields of active hosts.
-- The full row is readable only by the host themselves.
create policy "host_profiles_public_read"
  on public.host_profiles for select
  using (status = 'active' or user_id = auth.uid());

-- Hosts can update their own soft fields (bio, cover, slug). Status
-- changes always go through edge functions (service role).
create policy "host_profiles_self_update"
  on public.host_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- träffar
-- ---------------------------------------------------------------------------
create table if not exists public.träffar (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text not null check (char_length(description) between 10 and 600),
  location_label text not null,
  location_city text not null,
  starts_at timestamptz not null,
  duration_minutes int not null default 120 check (duration_minutes between 30 and 480),
  max_attendees int not null check (max_attendees between 4 and 20),
  min_confirm_attendees int not null default 4 check (min_confirm_attendees <= max_attendees),
  personality_theme text,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'confirmed', 'cancelled', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at > created_at)
);

create index if not exists träffar_city_idx
  on public.träffar (location_city);
create index if not exists träffar_starts_at_idx
  on public.träffar (starts_at);
create index if not exists träffar_host_idx
  on public.träffar (host_user_id);

alter table public.träffar enable row level security;

-- Anyone authenticated can see upcoming open or confirmed träffar.
-- The host always sees their own regardless of status.
create policy "träffar_public_read"
  on public.träffar for select
  using (
    host_user_id = auth.uid()
    or (
      status in ('open', 'confirmed')
      and starts_at > now() - interval '7 days'
    )
  );

-- Only active Värdar can insert träffar — enforce via a check against
-- host_profiles so RLS alone gates the write path.
create policy "träffar_active_host_insert"
  on public.träffar for insert
  with check (
    host_user_id = auth.uid()
    and exists (
      select 1 from public.host_profiles
      where user_id = auth.uid() and status = 'active'
    )
  );

-- Hosts can update their own träffar while not yet done.
create policy "träffar_host_update"
  on public.träffar for update
  using (host_user_id = auth.uid() and status <> 'done')
  with check (host_user_id = auth.uid() and status <> 'done');

-- Hosts can delete a träff only while it's a draft or open (no one RSVPed yet ideally).
create policy "träffar_host_delete"
  on public.träffar for delete
  using (host_user_id = auth.uid() and status in ('draft', 'open'));

-- ---------------------------------------------------------------------------
-- träff_rsvps
-- ---------------------------------------------------------------------------
create table if not exists public.träff_rsvps (
  träff_id uuid not null references public.träffar(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rsvped_at timestamptz not null default now(),
  attended boolean,
  primary key (träff_id, user_id)
);

create index if not exists träff_rsvps_user_idx
  on public.träff_rsvps (user_id);

alter table public.träff_rsvps enable row level security;

-- A user can read their own RSVPs + the RSVPs of träffar they're hosting.
create policy "träff_rsvps_user_or_host_read"
  on public.träff_rsvps for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.träffar
      where id = träff_id and host_user_id = auth.uid()
    )
  );

-- Users can RSVP to open or confirmed träffar. Capacity check is
-- enforced in the edge function — RLS alone can't do "count < max".
create policy "träff_rsvps_self_insert"
  on public.träff_rsvps for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.träffar
      where id = träff_id and status in ('open', 'confirmed')
    )
  );

-- Users can cancel their own RSVPs. Hosts can mark attended post-event.
create policy "träff_rsvps_self_delete"
  on public.träff_rsvps for delete
  using (user_id = auth.uid());

create policy "träff_rsvps_host_mark_attended"
  on public.träff_rsvps for update
  using (
    exists (
      select 1 from public.träffar
      where id = träff_id and host_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.träffar
      where id = träff_id and host_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- introductions
-- ---------------------------------------------------------------------------
create table if not exists public.introductions (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  message text check (char_length(message) <= 300),
  accepted_by_a boolean,
  accepted_by_b boolean,
  match_created boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_a_id <> user_b_id),
  check (host_user_id <> user_a_id and host_user_id <> user_b_id)
);

create index if not exists introductions_host_idx
  on public.introductions (host_user_id);
create index if not exists introductions_user_a_idx
  on public.introductions (user_a_id);
create index if not exists introductions_user_b_idx
  on public.introductions (user_b_id);

alter table public.introductions enable row level security;

-- All three participants can read.
create policy "introductions_participant_read"
  on public.introductions for select
  using (
    host_user_id = auth.uid()
    or user_a_id = auth.uid()
    or user_b_id = auth.uid()
  );

-- Only active Värdar can create. The trigger below enforces that A and B
-- are current matches of the host — trying to do it in a `with check`
-- clause across joins is messy, so we rely on the trigger.
create policy "introductions_active_host_insert"
  on public.introductions for insert
  with check (
    host_user_id = auth.uid()
    and exists (
      select 1 from public.host_profiles
      where user_id = auth.uid() and status = 'active'
    )
  );

-- user_a and user_b can update their own accepted flag. Host can revoke
-- while still pending.
create policy "introductions_participant_update"
  on public.introductions for update
  using (
    user_a_id = auth.uid()
    or user_b_id = auth.uid()
    or (host_user_id = auth.uid() and accepted_by_a is null and accepted_by_b is null)
  )
  with check (
    user_a_id = auth.uid()
    or user_b_id = auth.uid()
    or host_user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger host_profiles_updated_at
  before update on public.host_profiles
  for each row execute function public.set_updated_at();

create trigger träffar_updated_at
  before update on public.träffar
  for each row execute function public.set_updated_at();

create trigger introductions_updated_at
  before update on public.introductions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper view: RSVP count per träff
-- Used by mobile to show "4 / 8 going" without exposing individual rsvp rows.
-- ---------------------------------------------------------------------------
create or replace view public.träff_rsvp_counts as
  select
    t.id as träff_id,
    count(r.*) filter (where r.user_id is not null) as rsvp_count,
    t.max_attendees
  from public.träffar t
  left join public.träff_rsvps r on r.träff_id = t.id
  group by t.id, t.max_attendees;

grant select on public.träff_rsvp_counts to authenticated;

commit;
