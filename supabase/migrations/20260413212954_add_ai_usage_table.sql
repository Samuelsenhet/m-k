-- Backend-only analytics for AI calls from edge functions.
-- Written fire-and-forget after each upstream AI provider call (Anthropic, OpenAI, etc).
-- Source of truth for cost/latency/error rates — queried via SQL editor or synced to PostHog later.
--
-- RLS: service role only. Regular authenticated users must never read this table —
-- it contains usage signals that could leak user activity patterns.

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  function_name text not null,
  provider text not null,
  model text not null,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  latency_ms integer,
  status text not null check (status in ('ok','error')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_created_at_idx
  on public.ai_usage (created_at desc);

create index if not exists ai_usage_user_created_at_idx
  on public.ai_usage (user_id, created_at desc);

create index if not exists ai_usage_function_created_at_idx
  on public.ai_usage (function_name, created_at desc);

alter table public.ai_usage enable row level security;

-- No user-facing policies: service_role bypasses RLS entirely,
-- and every select from an authenticated JWT returns zero rows.
create policy "No user reads on ai_usage"
  on public.ai_usage
  for all
  using (false)
  with check (false);

comment on table public.ai_usage is
  'Backend-only audit log of AI provider calls (Anthropic, OpenAI, etc). Service role only.';
comment on column public.ai_usage.provider is
  'anthropic | openai | lovable | google | ...';
comment on column public.ai_usage.status is
  'ok = upstream 2xx and parsed successfully; error = upstream or parsing failure';
