# Värdar — MÄÄK Hosts Program

> Status: **Spec v1** · Implementation: **Fas 0 — Landing teaser live** · Backend + mobile: **planned post-launch**

## TL;DR

**Värdar** is MÄÄK's answer to "ambassador programs" for dating apps, without any of the affiliate / MLM / revenue-share dynamics. A Värd is a user who creates social energy inside MÄÄK — by running active Samlingar, hosting Träffar (IRL events), and introducing matches to each other. Värd status is **earned**, **manually approved** by the MÄÄK team, and grants access to internal tools and community perks. Premium is included while active.

**Principle:** Everything happens *inside* MÄÄK. There are no external invite links, no viral-growth mechanics, no revenue share. Värdar is a **retention and engagement** feature, not a growth feature.

---

## Why this design, and not a normal ambassador program

Normal ambassador/affiliate programs for dating apps fail for three reasons:

1. **Social friction** — users don't want to recruit their friends onto a dating app
2. **Misaligned incentives** — revenue share attracts growth-hackers, repels thoughtful connectors
3. **Brand clash** — leaderboards and tier-stacking contradict MÄÄK's calm-dating positioning

Värdar sidesteps all three:
- **No external recruitment**. A Värd acts only on existing MÄÄK users.
- **No revenue share**. Premium (199 kr/mo) is the only material reward.
- **Binary status**. You're either a Värd or you're not. No tiers, no XP, no leaderboards.
- **Manual approval**. Rare-by-design — scarcity makes the status valuable.

## Core concepts

### The three things a Värd does

1. **Creates Samlingar** that stay alive (existing feature, no change — Värdar get slightly better tools once approved)
2. **Hosts Träffar** — public IRL events in their city, RSVPable by any MÄÄK user
3. **Introduces matches** — curated handoff between two of the Värd's own matches who they think would click

Samlingar is unchanged for everyone else — it remains a matches-only group-chat consolidation feature.

### Earning Värd status

Any one of these, plus verified profile + MÄÄK team review:

| Path | Criterion |
|---|---|
| A | Created a Samling with 5+ active members that has 20+ messages in the last 14 days |
| B | Hosted a Träff that had 4+ confirmed attendees |
| C | Made 3 successful introductions (both introduced users accepted and started a chat) |

A nightly edge function `host-eligibility-check` flags users who meet any criterion. The MÄÄK team manually reviews each candidate and approves, keeping the pool small and high quality for the first year.

### Keeping Värd status

Aktive = at least one of the following in the last 60 days:
- Samling activity (new messages in their Samling)
- Träff hosted or RSVPed
- Introduction sent

If inactive 60+ days, status auto-pauses with a polite email. Re-activated by meeting any criterion again.

### What Värdar get

**Tools (unlocked on approval):**
- Create Träffar (locked for non-Värdar)
- Make introductions between two of their own matches (locked for non-Värdar)
- Samling member cap raised from default → 25
- Custom Samling cover images (from a curated set)
- AI-generated topic prompts per Samling theme
- Weekly "reinvigorate"-button to ping inactive Samling members

**Status:**
- `Värd` badge on profile
- Vanity slug (`maakapp.se/v/elin`) *— Note: no external landing, just for share-ability*
- Samling cards show "Värd: [name]"

**Access:**
- Värdrummet — auto-joined host-only Samling with all other Värdar in Sweden
- Monthly "Värdbrev" email with trends + MÄÄK team updates
- 30-day early access to new features (behind a PostHog feature flag)

**Material:**
- Free MÄÄK Premium (199 kr/mo) as long as the Värd is active — entitlement via RevenueCat override, not normal purchase
- Quarterly "Värdmiddag" — in-person dinner in Stockholm / Göteborg / Malmö, MÄÄK team hosts

### Who can be a Värd

- Must be verified (ID + personality test completed)
- Must have real profile photo + bio
- Must have been active in MÄÄK for ≥ 14 days
- Must meet at least one earning criterion (A, B, or C above)
- Must pass manual team review

### Who cannot

- Paid subscribers don't get auto-Värd status — subscription and Värd are decoupled
- Users with reports against them or moderation flags are ineligible
- Users who have been a Värd and lost status due to misuse cannot re-apply for 6 months

---

## Data model

### `host_profiles`
Stores Värd state. One row per approved / candidate host.

```sql
create table host_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'paused', 'declined', 'revoked')),
  eligible_via text check (eligible_via in ('samling', 'träff', 'introductions')),
  eligibility_notes text,
  activated_at timestamptz,
  paused_at timestamptz,
  last_activity_at timestamptz default now(),
  bio_extended text,
  cover_image_id text,
  slug text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index host_profiles_status_idx on host_profiles(status);
create index host_profiles_last_activity_idx on host_profiles(last_activity_at);
```

### `träffar`
A Värd's public event. Visible in the "Träffar nära dig" feed to all MÄÄK users in the same city.

```sql
create table träffar (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  location_label text not null,          -- "Katarinabaren, Stockholm"
  location_city text not null,           -- "Stockholm" — used for feed filter
  starts_at timestamptz not null,
  duration_minutes int default 120,
  max_attendees int not null check (max_attendees between 4 and 20),
  min_confirm_attendees int default 4,   -- Träff is cancelled if this isn't reached
  personality_theme text,                -- optional, e.g. "DIPLOMATER" or NULL for open
  status text not null check (status in ('draft', 'open', 'confirmed', 'cancelled', 'done')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index träffar_city_idx on träffar(location_city);
create index träffar_starts_at_idx on träffar(starts_at);
create index träffar_host_idx on träffar(host_user_id);
```

### `träff_rsvps`
Who's going to each Träff.

```sql
create table träff_rsvps (
  träff_id uuid not null references träffar(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rsvped_at timestamptz default now(),
  attended boolean,                      -- set post-event by host, null before
  primary key (träff_id, user_id)
);

create index träff_rsvps_user_idx on träff_rsvps(user_id);
```

### `introductions`
A Värd-created introduction between two of their own matches.

```sql
create table introductions (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  message text,
  created_at timestamptz default now(),
  accepted_by_a boolean,
  accepted_by_b boolean,
  match_created boolean default false,   -- true once both accept and a match row exists
  check (user_a_id <> user_b_id),
  check (host_user_id <> user_a_id and host_user_id <> user_b_id)
);

create index introductions_host_idx on introductions(host_user_id);
create index introductions_user_a_idx on introductions(user_a_id);
create index introductions_user_b_idx on introductions(user_b_id);
```

---

## RLS policies

All tables have `alter table ... enable row level security`.

### `host_profiles`
- `select` — any authenticated user can read `status`, `slug`, `cover_image_id`, `bio_extended` for any host (`status = 'active'`). Full row readable only by the host themselves.
- `update` — only the host themselves can update `bio_extended`, `cover_image_id`, `slug`. Status changes only via edge function (service role).
- `insert` / `delete` — only service role.

### `träffar`
- `select` — any authenticated user can read träffar where `status in ('open', 'confirmed')` and `starts_at > now() - interval '7 days'`. Host can read their own including drafts and past.
- `insert` — only users with `host_profiles.status = 'active'`. Server-side check via trigger.
- `update` — only the `host_user_id`. Cannot update once `status = 'done'`.
- `delete` — only the `host_user_id` and only while `status in ('draft', 'open')`.

### `träff_rsvps`
- `select` — user can see their own RSVPs. Host can see all RSVPs for their own träffar. Anyone can see the RSVP count for a träff (via a view that groups by träff_id).
- `insert` — authenticated user can RSVP to an `open` or `confirmed` träff they haven't RSVPed to, up to `max_attendees`. Edge function enforces capacity.
- `update` — only the host can set `attended` post-event.
- `delete` — user can cancel their own RSVP.

### `introductions`
- `select` — host can read their own; user_a and user_b can read introductions that name them.
- `insert` — only users with `host_profiles.status = 'active'`, and only for two of their own current matches (checked via trigger).
- `update` — user_a and user_b can set their own `accepted_by_*` flag.
- `delete` — host can revoke a pending introduction; nobody can delete one after both accepted.

---

## Edge functions

All functions deployed in `supabase/functions/`:

### `host-eligibility-check`
**Trigger:** cron nightly at 03:00 CET
**Auth:** service role
**What it does:**
1. Query Samlingar with ≥ 5 members and ≥ 20 messages in last 14 days → candidate creators
2. Query träffar with `status = 'done'` and ≥ 4 `attended = true` RSVPs → candidate hosts
3. Query introductions with `accepted_by_a = true AND accepted_by_b = true` → candidate introducers, group by `host_user_id`, require ≥ 3
4. For each candidate not already in `host_profiles`, insert with `status = 'pending'` and `eligible_via`
5. Send Slack notification (or email) to MÄÄK team: *"3 new candidate hosts this week"*

### `host-approve`
**Trigger:** manual call by team (from admin dashboard or CLI)
**Auth:** service role + admin check
**What it does:**
1. Set `host_profiles.status = 'active'` and `activated_at = now()`
2. Add user to Värdrummet Samling (auto-create system matches if needed)
3. Grant RevenueCat entitlement `värd_premium` (free Premium)
4. Send welcome push notification + email
5. Emit PostHog event `host_approved` with `user_id` + `eligible_via`

### `host-pause`
**Trigger:** cron weekly (Sundays)
**Auth:** service role
**What it does:**
1. Query `host_profiles` where `status = 'active'` and `last_activity_at < now() - interval '60 days'`
2. Set to `paused` and `paused_at = now()`
3. Revoke RevenueCat entitlement
4. Send polite email
5. Emit `host_paused` PostHog event

### `träff-rsvp`
**Trigger:** mobile call
**Auth:** user JWT
**What it does:**
1. Check träff is `open` or `confirmed` and hasn't started
2. Check not already RSVPed
3. Check capacity (`current rsvp count < max_attendees`)
4. Insert `träff_rsvps` row
5. If new rsvp count reaches `min_confirm_attendees`, set träff `status = 'confirmed'` and push-notify all current RSVPers + the host
6. Emit `träff_rsvp` PostHog event

### `introduction-create`
**Trigger:** mobile call from Värd
**Auth:** user JWT (must be active Värd)
**What it does:**
1. Verify both `user_a_id` and `user_b_id` are current matches of the host
2. Insert `introductions` row
3. Push-notify both users with the introduction message
4. Emit `introduction_sent` PostHog event

### `introduction-respond`
**Trigger:** mobile call from user_a or user_b
**Auth:** user JWT
**What it does:**
1. Set appropriate `accepted_by_*` flag
2. If both now accepted → create a match row between user_a and user_b via the normal matches table, and set `match_created = true`
3. Push-notify the other user and the host
4. Emit `introduction_accepted` or `introduction_declined`

---

## Mobile UI

### New / changed screens

**`apps/mobile/src/app/(tabs)/träffar.tsx`** *(new tab, OR sub-route depending on existing tab density)*
Feed of upcoming Träffar in the user's city, filtered by city derived from profile location. Big "Hosted by [Värd name]" header per card. Tap → `träff/[id].tsx`.

**`apps/mobile/src/app/träff/[id].tsx`**
Detail page — title, description, location, time, attendee list, RSVP button or "You're going" state.

**`apps/mobile/src/app/träff/create.tsx`** *(host-gated)*
Creation form, visible only if `useHostProfile().status === 'active'`. Opens from a "+"-button in the träffar feed.

**`apps/mobile/src/app/host/introduce.tsx`**
Flow for a Värd to introduce two matches: pick matcher A, pick matcher B, write a message. Validate both are current matches.

**`apps/mobile/src/app/host/värdrummet.tsx`** *(alias, actually opens the auto-joined Samling)*
No new code needed — Värdrummet is a normal Samling from the app's point of view. The Värd is automatically a member.

**`apps/mobile/src/components/host/HostBadge.tsx`**
Reusable badge that renders on profile cards if the user is an active Värd.

**`apps/mobile/src/components/host/IntroduceButton.tsx`**
Renders on a match profile view if the viewer is a Värd and has at least one other match.

**`apps/mobile/src/hooks/useHostProfile.ts`**
Fetches the current user's `host_profiles` row. Returns `{ status, isActive, unlockedAt }`.

**Introduction notifications in `apps/mobile/src/app/(tabs)/index.tsx`**
New card type rendered in the match feed: *"[Värd] vill introducera dig för [Other User]"*.

### Subscription / paywall integration

- `useSubscription.ts` gets a new derived flag: `isHostEntitlement = subscription.source === 'host_grant'`
- If a Värd's status pauses → entitlement revoked → paywall returns to normal gating
- No visible "Värd pays nothing" UI — it just works transparently

---

## PostHog events

All events prefixed with `host_*` or `träff_*` or `introduction_*`:

| Event | When | Properties |
|---|---|---|
| `host_eligibility_met` | Nightly check flags a candidate | `eligible_via`, `user_id` (server-only) |
| `host_approved` | Team approves a host | `eligible_via`, `reviewer_id` |
| `host_paused` | Auto-paused for inactivity | `last_activity_days_ago` |
| `host_revoked` | Team revokes for misuse | `reason` (free text) |
| `träff_created` | Host creates a träff | `city`, `personality_theme`, `max_attendees` |
| `träff_rsvp` | User RSVPs | `träff_id`, `personality_theme` |
| `träff_confirmed` | Min attendees reached | `träff_id`, `confirmed_count` |
| `träff_cancelled` | Cancelled before happening | `reason` |
| `träff_happened` | Host marks as done | `attended_count` |
| `introduction_sent` | Värd creates introduction | `target_user_personality`, `has_message` |
| `introduction_accepted` | Both users accepted | `latency_minutes` |
| `introduction_declined` | Either declined | `declined_by` |

These events map into PostHog insights we'll create post-launch:
- **Host funnel:** `host_eligibility_met` → `host_approved` → first `träff_created` or `introduction_sent`
- **Träff funnel:** `träff_created` → `träff_confirmed` → `träff_happened`
- **Introduction success rate:** `introduction_sent` → `introduction_accepted`
- **Host activity over time:** cohort trend on `träff_created` + `introduction_sent`

---

## Rollout plan

### Fas 0 — Landing teaser (DONE)
Landing section on `maakapp.se/#vardar` teases the program. No code in app, no backend. Goal: signal that MÄÄK has a plan here.

### Fas 1 — Database foundations (1 session)
- Supabase migration with all 4 tables + RLS
- Generate TS types
- Not shipped in app yet

### Fas 2 — Mobile scaffolding (1 session)
- Host profile hook
- Placeholder `träffar.tsx` tab showing empty state with "Coming soon" copy
- `HostBadge` component (renders nowhere yet, ready to drop in)

### Fas 3 — Träffar feature (2-3 sessions)
- `träff-rsvp` edge function
- Full `träffar.tsx` + `träff/[id].tsx` + `träff/create.tsx`
- RSVP push notifications
- Host-gated creation
- PostHog events

### Fas 4 — Introductions feature (2 sessions)
- `introduction-create` + `introduction-respond` edge functions
- `IntroduceButton` in match profile view
- Notification card in match feed
- PostHog events

### Fas 5 — Host status + tools (2 sessions)
- `host-eligibility-check` nightly cron
- Manual approval UI for the team (could be a simple Supabase Studio query template for v1)
- `host-approve` function with RevenueCat entitlement grant
- Värdrummet Samling auto-join
- `host-pause` weekly cron
- Host-only UI flags (Samling cap, IntroduceButton visibility, träff/create access)
- `useHostProfile` hook
- Värd badge on profile cards

### Fas 6 — Marketing + polish (1 session)
- Värdbrev email template + Resend integration
- Värdmiddag planning doc (internal, not code)
- Update `/vardar` landing page with "Now live" status once the first 10 hosts are approved

**Estimated total:** 8-11 sessions, spread over months 1-6 post-launch.

**Do not start Fas 1-6 until:**
1. App Store launch is behind us
2. MÄÄK has ≥ 100 active users across at least 2 cities
3. At least 5 active Samlingar exist organically

If these conditions aren't met, Värdar has nothing to work on and we're building on sand.

---

## Open questions

Things we haven't decided yet and need to figure out during implementation:

1. **Slug collision handling** — what if two users want `maakapp.se/v/elin`? First-come-first-served, or team-assigned.
2. **Multi-city Värdar** — can a Värd host Träffar in multiple cities? First version: no, one city per Värd. Revisit later.
3. **Träff cancellations** — who refunds or compensates attendees if the Värd cancels last-minute? Currently nobody — attendees just get a notification. Revisit after first real cancellation.
4. **Introductions to non-matches** — Värd has a friend who's not a match. Can they "introduce" them? No — introductions require both to already be matches of the Värd. Keeps the feature simple and abuse-resistant.
5. **Värdrummet at scale** — once there are 100+ Värdar in Sweden, Värdrummet becomes unwieldy. Split by city? By language? Revisit at 50 active Värdar.
6. **IRL Värdmiddag logistics** — booking, dietary restrictions, payment. Manual for v1, no app integration.

---

## Related files

- `apps/landing/components/VardarSection.tsx` — landing teaser
- `apps/landing/content/home.ts` — landing copy (`VARDAR_*` constants)
- `supabase/migrations/{timestamp}_create_host_profiles.sql` — *(to be created in Fas 1)*
- `apps/mobile/src/hooks/useHostProfile.ts` — *(to be created in Fas 2)*
- `apps/mobile/src/app/(tabs)/träffar.tsx` — *(to be created in Fas 2-3)*
- `supabase/functions/host-eligibility-check/` — *(to be created in Fas 5)*
- `supabase/functions/träff-rsvp/` — *(to be created in Fas 3)*
- `supabase/functions/introduction-create/` — *(to be created in Fas 4)*
