/**
 * Supabase client — plug in your credentials to activate real persistence.
 *
 * Steps:
 *   1. Run the SQL schema below in your Supabase SQL editor
 *   2. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment
 *   3. Uncomment the client export and swap localStorage calls in app-store.tsx
 */

// import { createClient } from "@supabase/supabase-js";
//
// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
// const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
//
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*
──────────────────────────────────────────────────────────────
  SUKASPACE — Full SQL Schema
  Run this in Supabase → SQL Editor
──────────────────────────────────────────────────────────────

-- Users & roles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  avatar_url text,
  bio text,
  role text not null default 'learner' check (role in ('creator','learner')),
  created_at timestamptz default now()
);

create table if not exists creator_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  logo_url text,
  tagline text,
  website text,
  updated_at timestamptz default now()
);

-- Communities
create table if not exists communities (
  id bigserial primary key,
  title text not null,
  summary text,
  category text,
  tag text default 'FREE' check (tag in ('FREE','PAID')),
  price text,
  banner text,
  avatar text,
  creator_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists community_memberships (
  community_id bigint references communities(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('creator','moderator','member')),
  joined_at timestamptz default now(),
  primary key (community_id, user_id)
);

-- Feed
create table if not exists posts (
  id bigserial primary key,
  community_id bigint references communities(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  channel text default 'general',
  title text,
  body text not null,
  category text,
  likes int default 0,
  created_at timestamptz default now()
);

create table if not exists comments (
  id bigserial primary key,
  post_id bigint references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists reactions (
  post_id bigint references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  emoji text not null,
  primary key (post_id, user_id, emoji)
);

-- Events
create table if not exists events (
  id bigserial primary key,
  community_id bigint references communities(id) on delete cascade,
  title text not null,
  event_date date not null,
  event_time time,
  type text default 'session' check (type in ('session','deadline','meetup','personal')),
  created_at timestamptz default now()
);

-- Courses
create table if not exists courses (
  id bigserial primary key,
  community_id bigint references communities(id) on delete set null,
  creator_id uuid references profiles(id) on delete set null,
  title text not null,
  description text,
  published boolean default false,
  enrollment_count int default 0,
  created_at timestamptz default now()
);

create table if not exists modules (
  id bigserial primary key,
  course_id bigint references courses(id) on delete cascade,
  title text not null,
  sort_order int default 0
);

create table if not exists lessons (
  id bigserial primary key,
  module_id bigint references modules(id) on delete cascade,
  course_id bigint references courses(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  published boolean default false,
  sort_order int default 0
);

create table if not exists enrollments (
  course_id bigint references courses(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  enrolled_at timestamptz default now(),
  primary key (course_id, user_id)
);

create table if not exists lesson_completions (
  lesson_id bigint references lessons(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (lesson_id, user_id)
);

-- Resources
create table if not exists resources (
  id bigserial primary key,
  title text not null,
  url text not null,
  source text default 'other',
  lesson_id bigint references lessons(id) on delete cascade,
  added_at timestamptz default now()
);

create table if not exists community_resources (
  id bigserial primary key,
  community_id bigint references communities(id) on delete cascade,
  title text not null,
  url text not null,
  source text default 'other',
  added_at timestamptz default now()
);

create table if not exists course_resources (
  id bigserial primary key,
  course_id bigint references courses(id) on delete cascade,
  title text not null,
  url text not null,
  source text default 'other',
  added_at timestamptz default now()
);

create table if not exists access_records (
  id bigserial primary key,
  resource_id bigint references resources(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  accessed_at timestamptz default now()
);
*/

export {};
