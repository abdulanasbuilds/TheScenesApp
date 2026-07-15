-- ─────────────────────────────────────────────────────────────────────────
-- SukaSpace — Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query.
--
-- Design notes:
--   * Row ids are bigint and are generated client-side (Date.now()-based),
--     not by the database, so the app's existing nested update logic
--     (modules/lessons keyed by id) didn't need to change.
--   * Most app-level relationships are keyed by the user's email (text),
--     matching how the app already identifies "the current user" throughout
--     its UI — not by auth.users.id — to keep the data model close to what
--     the app already expects.
--   * RLS is enabled everywhere. Policies here are permissive (any signed-in
--     user can read/write most rows) to match the app's current "no real
--     backend" trust model — every write already happens from the client.
--     Tighten these before you rely on this for anything sensitive.
-- ─────────────────────────────────────────────────────────────────────────

-- Profile row created for every authenticated user (name/role/avatar/bio).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null default 'learner' check (role in ('creator', 'learner')),
  avatar text,
  photo_url text,
  bio text,
  created_at timestamptz default now()
);

create table if not exists communities (
  id bigint primary key,
  title text not null,
  category text,
  members int not null default 1,
  creator text,
  creator_email text,
  avatar text,
  banner text,
  tag text not null default 'FREE' check (tag in ('FREE', 'PAID')),
  price text,
  summary text,
  created_at bigint not null
);

create table if not exists joined_communities (
  community_id bigint references communities(id) on delete cascade,
  user_email text not null,
  primary key (community_id, user_email)
);

create table if not exists posts (
  id bigint primary key,
  community_id bigint references communities(id) on delete cascade,
  channel text not null default 'general',
  author text,
  role text,
  avatar text,
  title text,
  category text,
  likes int not null default 0,
  comments int not null default 0,
  body text not null,
  created_at bigint not null
);

create table if not exists liked_posts (
  post_id bigint references posts(id) on delete cascade,
  user_email text not null,
  primary key (post_id, user_email)
);

create table if not exists comments (
  id bigint primary key,
  post_id bigint references posts(id) on delete cascade,
  author text,
  avatar text,
  body text not null,
  created_at bigint not null
);

create table if not exists reactions (
  post_id bigint references posts(id) on delete cascade,
  user_email text not null,
  emoji text not null,
  primary key (post_id, user_email, emoji)
);

create table if not exists courses (
  id bigint primary key,
  community_id bigint references communities(id) on delete set null,
  title text not null,
  description text,
  creator_email text,
  published boolean not null default false,
  enrollment_count int not null default 0,
  created_at bigint not null
);

create table if not exists modules (
  id bigint primary key,
  course_id bigint references courses(id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);

create table if not exists lessons (
  id bigint primary key,
  module_id bigint references modules(id) on delete cascade,
  course_id bigint references courses(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  published boolean not null default false,
  sort_order int not null default 0
);

create table if not exists lesson_resources (
  id bigint primary key,
  lesson_id bigint references lessons(id) on delete cascade,
  title text not null,
  url text not null,
  source text default 'other',
  added_at bigint not null
);

create table if not exists community_resources (
  id bigint primary key,
  community_id bigint references communities(id) on delete cascade,
  title text not null,
  url text not null,
  source text default 'other',
  added_at bigint not null
);

create table if not exists community_events (
  id bigint primary key,
  community_id bigint references communities(id) on delete cascade,
  title text not null,
  event_date text not null,
  event_time text,
  type text not null default 'session' check (type in ('session', 'deadline', 'meetup', 'personal')),
  created_at bigint not null
);

create table if not exists enrollments (
  course_id bigint references courses(id) on delete cascade,
  user_email text not null,
  completed_lesson_ids bigint[] not null default '{}',
  enrolled_at bigint not null,
  primary key (course_id, user_email)
);

create table if not exists access_records (
  id bigint primary key,
  resource_id bigint,
  resource_title text,
  resource_type text check (resource_type in ('lesson', 'community')),
  community_id bigint,
  user_email text,
  accessed_at bigint not null
);

create table if not exists notifications (
  id bigint primary key,
  user_email text not null,
  text text not null,
  time text,
  read boolean not null default false,
  created_at bigint not null
);

-- ─── Row Level Security ─────────────────────────────────────────────────

alter table profiles enable row level security;
alter table communities enable row level security;
alter table joined_communities enable row level security;
alter table posts enable row level security;
alter table liked_posts enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table lesson_resources enable row level security;
alter table community_resources enable row level security;
alter table community_events enable row level security;
alter table enrollments enable row level security;
alter table access_records enable row level security;
alter table notifications enable row level security;

create policy "profiles are readable by any signed-in user" on profiles for select using (auth.role() = 'authenticated');
create policy "users manage their own profile" on profiles for insert with check (auth.uid() = id);
create policy "users update their own profile" on profiles for update using (auth.uid() = id);

create policy "authenticated read/write communities" on communities for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write joined_communities" on joined_communities for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write posts" on posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write liked_posts" on liked_posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write comments" on comments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write reactions" on reactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write courses" on courses for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write modules" on modules for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write lessons" on lessons for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write lesson_resources" on lesson_resources for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write community_resources" on community_resources for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write community_events" on community_events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write enrollments" on enrollments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write access_records" on access_records for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write notifications" on notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
