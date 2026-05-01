revoke create on schema public from public;
revoke create on schema public from anon;
revoke create on schema public from authenticated;
grant usage on schema public to anon;
grant usage on schema public to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null check (char_length(trim(display_name)) between 1 and 24),
  subscriber_count integer not null default 50000 check (subscriber_count >= 0),
  last_subscriber_delta integer not null default 0,
  has_subscriber_outcome boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_leaderboard_idx
  on public.profiles (subscriber_count desc, updated_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Authenticated users can view leaderboard" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'leaderboard_profiles'
      and c.relkind in ('v', 'm')
  ) then
    drop view public.leaderboard_profiles;
  end if;
end;
$$;

create table if not exists public.leaderboard_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 24),
  subscriber_count integer not null default 50000 check (subscriber_count >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists leaderboard_profiles_rank_idx
  on public.leaderboard_profiles (subscriber_count desc, updated_at desc);

insert into public.leaderboard_profiles (id, display_name, subscriber_count, updated_at)
select id, display_name, subscriber_count, updated_at
from public.profiles
on conflict (id) do update
set
  display_name = excluded.display_name,
  subscriber_count = excluded.subscriber_count,
  updated_at = excluded.updated_at;

create or replace function public.sync_leaderboard_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.leaderboard_profiles where id = old.id;
    return old;
  end if;

  insert into public.leaderboard_profiles (id, display_name, subscriber_count, updated_at)
  values (new.id, new.display_name, new.subscriber_count, new.updated_at)
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    subscriber_count = excluded.subscriber_count,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function public.sync_leaderboard_profile() from public;
revoke all on function public.sync_leaderboard_profile() from anon;
revoke all on function public.sync_leaderboard_profile() from authenticated;

drop trigger if exists profiles_sync_leaderboard_profile on public.profiles;
create trigger profiles_sync_leaderboard_profile
after insert or update or delete on public.profiles
for each row
execute function public.sync_leaderboard_profile();

alter table public.leaderboard_profiles enable row level security;

drop policy if exists "Authenticated users can view leaderboard" on public.leaderboard_profiles;
create policy "Authenticated users can view leaderboard"
on public.leaderboard_profiles
for select
to authenticated
using (true);

revoke select on public.profiles from anon;
revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select (
  id,
  email,
  display_name,
  subscriber_count,
  last_subscriber_delta,
  has_subscriber_outcome,
  updated_at
) on public.profiles to authenticated;
grant insert (
  id,
  email,
  display_name
) on public.profiles to authenticated;
grant update (
  email,
  display_name,
  subscriber_count,
  last_subscriber_delta,
  has_subscriber_outcome
) on public.profiles to authenticated;

revoke all on public.leaderboard_profiles from public;
revoke all on public.leaderboard_profiles from anon;
revoke all on public.leaderboard_profiles from authenticated;
grant select on public.leaderboard_profiles to authenticated;

create table if not exists public.suggestions (
  id bigint generated by default as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(trim(display_name)) between 1 and 24),
  message text not null check (char_length(trim(message)) between 1 and 500),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists suggestions_created_at_idx
  on public.suggestions (created_at desc);

alter table public.suggestions enable row level security;

drop policy if exists "Users can insert their own suggestions" on public.suggestions;
create policy "Users can insert their own suggestions"
on public.suggestions
for insert
to authenticated
with check ((select auth.uid()) = profile_id);

revoke all on public.suggestions from anon;
revoke all on public.suggestions from authenticated;
grant insert (
  profile_id,
  email,
  display_name,
  message
) on public.suggestions to authenticated;

create table if not exists public.chat_messages (
  id bigint generated by default as identity primary key,
  room_id text not null check (room_id ~ '^[a-z0-9_-]{1,32}$'),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 24),
  message text not null check (char_length(trim(message)) between 1 and 280),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_messages_room_id_id_idx
  on public.chat_messages (room_id, id desc);

create index if not exists chat_messages_profile_created_at_idx
  on public.chat_messages (profile_id, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "Authenticated users can view chat messages" on public.chat_messages;
create policy "Authenticated users can view chat messages"
on public.chat_messages
for select
to authenticated
using (true);

drop policy if exists "Users can insert their own chat messages" on public.chat_messages;
create policy "Users can insert their own chat messages"
on public.chat_messages
for insert
to authenticated
with check ((select auth.uid()) = profile_id);

revoke all on public.chat_messages from anon;
revoke all on public.chat_messages from authenticated;
grant select (
  id,
  room_id,
  profile_id,
  display_name,
  message,
  created_at
) on public.chat_messages to authenticated;
grant insert (
  room_id,
  profile_id,
  display_name,
  message
) on public.chat_messages to authenticated;

do $$
declare
  seq_name text;
begin
  seq_name := pg_get_serial_sequence('public.suggestions', 'id');
  if seq_name is not null then
    execute format('revoke all on sequence %s from anon', seq_name);
    execute format('revoke all on sequence %s from authenticated', seq_name);
    execute format('grant usage, select on sequence %s to authenticated', seq_name);
  end if;

  seq_name := pg_get_serial_sequence('public.chat_messages', 'id');
  if seq_name is not null then
    execute format('revoke all on sequence %s from anon', seq_name);
    execute format('revoke all on sequence %s from authenticated', seq_name);
    execute format('grant usage, select on sequence %s to authenticated', seq_name);
  end if;
end;
$$;

create table if not exists public.projector_state (
  id text primary key check (id = 'main'),
  mode text not null default 'offline' check (mode in ('offline', 'live', 'replay', 'archive_pending')),
  live_video_id text not null default '',
  replay_video_id text not null default '',
  replay_clock_video_id text not null default '',
  replay_started_at timestamptz,
  replay_duration_seconds integer,
  pending_archive_video_id text not null default '',
  uploads_playlist_id text not null default '',
  check_lease_expires_at timestamptz,
  last_live_check_at timestamptz,
  last_archive_check_at timestamptz,
  last_source text not null default '',
  last_error text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.projector_state
  add column if not exists replay_clock_video_id text not null default '';

alter table public.projector_state
  add column if not exists replay_started_at timestamptz;

alter table public.projector_state
  add column if not exists replay_duration_seconds integer;

insert into public.projector_state (id)
values ('main')
on conflict (id) do nothing;

drop trigger if exists projector_state_set_updated_at on public.projector_state;
create trigger projector_state_set_updated_at
before update on public.projector_state
for each row
execute function public.set_updated_at();

alter table public.projector_state enable row level security;

revoke all on public.projector_state from anon;
revoke all on public.projector_state from authenticated;

create or replace function public.claim_projector_refresh(lease_seconds integer default 20)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_updated integer := 0;
begin
  insert into public.projector_state (id)
  values ('main')
  on conflict (id) do nothing;

  update public.projector_state
  set check_lease_expires_at = timezone('utc', now()) + make_interval(secs => greatest(lease_seconds, 5))
  where id = 'main'
    and (
      check_lease_expires_at is null
      or check_lease_expires_at < timezone('utc', now())
    );

  get diagnostics rows_updated = ROW_COUNT;
  return rows_updated > 0;
end;
$$;

revoke all on function public.claim_projector_refresh(integer) from public;
revoke all on function public.claim_projector_refresh(integer) from anon;
revoke all on function public.claim_projector_refresh(integer) from authenticated;
grant execute on function public.claim_projector_refresh(integer) to service_role;

alter table realtime.messages enable row level security;

revoke all on realtime.messages from anon;
revoke all on realtime.messages from authenticated;
grant select, insert on realtime.messages to authenticated;

drop policy if exists "authenticated_users_can_receive_realtime" on realtime.messages;
drop policy if exists "authenticated_users_can_send_realtime" on realtime.messages;

drop policy if exists "Authenticated users can receive TBPN realtime room traffic" on realtime.messages;
create policy "Authenticated users can receive TBPN realtime room traffic"
on realtime.messages
for select
to authenticated
using (
  (select realtime.topic()) like 'tbpn-sim:world:%'
  and realtime.messages.extension in ('broadcast', 'presence')
);

drop policy if exists "Authenticated users can send TBPN realtime room traffic" on realtime.messages;
create policy "Authenticated users can send TBPN realtime room traffic"
on realtime.messages
for insert
to authenticated
with check (
  (select realtime.topic()) like 'tbpn-sim:world:%'
  and realtime.messages.extension in ('broadcast', 'presence')
);
