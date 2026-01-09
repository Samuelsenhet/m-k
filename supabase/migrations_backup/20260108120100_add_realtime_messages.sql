-- migration: add realtime messages table for chat functionality
-- supports broadcast-based realtime messaging with rls

-- create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);
comment on table public.messages is 'Chat messages for realtime communication.';

-- enable row level security
alter table public.messages enable row level security;

-- rls policies for messages - users can read messages in rooms they have access to
create policy "Users can view messages in their rooms"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members
      where room_members.room_id = messages.room_id
      and room_members.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their rooms"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.room_members
      where room_members.room_id = messages.room_id
      and room_members.user_id = auth.uid()
    )
  );

create policy "Users can update their own messages"
  on public.messages for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on public.messages for delete
  to authenticated
  using (auth.uid() = user_id);

-- indexes for performance
create index messages_room_id_idx on public.messages(room_id);
create index messages_user_id_idx on public.messages(user_id);
create index messages_created_at_idx on public.messages(created_at desc);

-- create rooms table for organizing messages
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);
comment on table public.rooms is 'Chat rooms for organizing messages.';

-- enable row level security
alter table public.rooms enable row level security;

-- rls policies for rooms
create policy "Users can view rooms they are members of"
  on public.rooms for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members
      where room_members.room_id = rooms.id
      and room_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = created_by);

-- create room_members table for managing room access
create table public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'moderator', 'member')),
  joined_at timestamptz default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);
comment on table public.room_members is 'Manages user membership in chat rooms.';

-- enable row level security
alter table public.room_members enable row level security;

-- rls policies for room_members
create policy "Users can view members of their rooms"
  on public.room_members for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = room_members.room_id
      and rm.user_id = auth.uid()
    )
  );

-- indexes for performance
create index room_members_room_id_idx on public.room_members(room_id);
create index room_members_user_id_idx on public.room_members(user_id);

-- trigger function to broadcast new messages
create or replace function public.broadcast_message_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_notify(
    'room:' || new.room_id::text,
    json_build_object(
      'type', 'message_created',
      'message', row_to_json(new)
    )::text
  );
  return new;
end;
$$;

-- trigger to broadcast message changes
create trigger on_message_created
  after insert on public.messages
  for each row
  execute function public.broadcast_message_changes();

-- trigger for updated_at on messages
create trigger set_updated_at_messages
  before update on public.messages
  for each row
  execute function public.handle_updated_at();

-- trigger for updated_at on rooms
create trigger set_updated_at_rooms
  before update on public.rooms
  for each row
  execute function public.handle_updated_at();