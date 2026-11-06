-- Phase 3A Wave 1 — 0002: public.profiles + the hardened Auth trigger.
--
-- Contract: §3.1, §5.1, §6. Exactly one profile insert path, database-set timestamps, and
-- column-scoped client access. `status` is never client-readable; profile updates are pinned to
-- the caller and an active profile through the private helper.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  display_name text not null,
  headline text,
  bio text,
  location text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  constraint profiles_display_name_len check (char_length(btrim(display_name)) between 2 and 80),
  constraint profiles_headline_len check (headline is null or char_length(headline) <= 140),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 2000),
  constraint profiles_location_len check (location is null or char_length(location) <= 80),
  constraint profiles_status_values check (status in ('active', 'suspended', 'deleted'))
);

create unique index profiles_handle_key on public.profiles (handle);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

comment on table public.profiles is
  'One row per auth user. Inserted only by private.handle_auth_user_created().';

-- Defined here (after the table, before the policies that call it) so policies need no forward
-- reference. The other approved helpers live in 0003 because they reference later tables.
create or replace function private.is_active_profile()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
  );
$$;

revoke all on function private.is_active_profile() from public;
grant execute on function private.is_active_profile() to authenticated;

-- AFTER INSERT on auth.users: validate metadata, insert exactly one profile, fail atomically.
create or replace function private.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_handle text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'handle', '')));
  v_display_name text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  -- Reject privileged keys that must never arrive through Auth metadata.
  if v_meta ?| array['status', 'role', 'id', 'created_at', 'updated_at', 'request_id'] then
    raise exception 'profile_metadata_rejected' using errcode = '22023';
  end if;

  if char_length(v_display_name) < 2 or char_length(v_display_name) > 80 then
    raise exception 'invalid_display_name' using errcode = '22023';
  end if;

  if v_handle !~ '^[a-z0-9][a-z0-9_-]{2,29}$' then
    raise exception 'invalid_handle' using errcode = '22023';
  end if;

  insert into public.profiles (id, handle, display_name)
  values (new.id, v_handle, v_display_name);

  return new;
end;
$$;

revoke all on function private.handle_auth_user_created() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_auth_user_created();

-- Access: active public columns readable by anon + authenticated; own-row updates only.
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select (id, handle, display_name, headline, bio, location) on public.profiles to anon, authenticated;
grant update (display_name, headline, bio, location) on public.profiles to authenticated;

create policy profiles_select_active on public.profiles
  for select
  to anon, authenticated
  using (status = 'active');

create policy profiles_update_own on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()) and private.is_active_profile())
  with check (id = (select auth.uid()) and private.is_active_profile());
