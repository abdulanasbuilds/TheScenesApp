-- ══════════════════════════════════════════════════════════════════════════════
-- SukaSpace — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to re-run: every statement uses IF NOT EXISTS / ON CONFLICT DO NOTHING
-- ══════════════════════════════════════════════════════════════════════════════

-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Synced from Supabase Auth on first sign-in
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY,          -- = auth.users.id
  email      TEXT        UNIQUE NOT NULL,
  name       TEXT        NOT NULL,
  role       TEXT        NOT NULL DEFAULT 'learner' CHECK (role IN ('creator','learner')),
  avatar     TEXT,
  bio        TEXT,
  photo_url  TEXT,
  created_at BIGINT      DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── communities ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communities (
  id              BIGINT      PRIMARY KEY,      -- client-generated via Date.now()
  title           TEXT        NOT NULL,
  summary         TEXT,
  category        TEXT        NOT NULL DEFAULT 'General',
  tag             TEXT        NOT NULL DEFAULT 'FREE' CHECK (tag IN ('FREE','PAID')),
  price           TEXT,
  creator         TEXT        NOT NULL,         -- display name
  creator_email   TEXT        NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  members         INTEGER     NOT NULL DEFAULT 1,
  avatar          TEXT,
  banner          TEXT,
  color           TEXT        DEFAULT '#3B82F6',
  cover_image_url TEXT,
  is_private      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      BIGINT      DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── joined_communities ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS joined_communities (
  community_id  BIGINT  NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_email    TEXT    NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  joined_at     BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
  PRIMARY KEY (community_id, user_email)
);

-- ─── posts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           BIGINT  PRIMARY KEY,
  community_id BIGINT  REFERENCES communities(id) ON DELETE CASCADE,
  channel      TEXT    NOT NULL DEFAULT 'general',
  author       TEXT    NOT NULL,
  role         TEXT    NOT NULL DEFAULT 'Member',
  avatar       TEXT,
  title        TEXT    NOT NULL DEFAULT '',
  category     TEXT    NOT NULL DEFAULT 'General',
  likes        INTEGER NOT NULL DEFAULT 0,
  comments     INTEGER NOT NULL DEFAULT 0,
  body         TEXT    NOT NULL,
  created_at   BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── liked_posts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS liked_posts (
  post_id    BIGINT  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_email TEXT    NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_email)
);

-- ─── comments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         BIGINT  PRIMARY KEY,
  post_id    BIGINT  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author     TEXT    NOT NULL,
  avatar     TEXT,
  body       TEXT    NOT NULL,
  created_at BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── reactions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  post_id    BIGINT  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_email TEXT    NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  emoji      TEXT    NOT NULL,
  PRIMARY KEY (post_id, user_email, emoji)
);

-- ─── direct_messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS direct_messages (
  id         BIGINT   PRIMARY KEY,
  from_email TEXT     NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  to_email   TEXT     NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  body       TEXT     NOT NULL,
  read       BOOLEAN  NOT NULL DEFAULT FALSE,
  created_at BIGINT   DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── courses ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id               BIGINT   PRIMARY KEY,
  community_id     BIGINT   REFERENCES communities(id) ON DELETE SET NULL,
  creator_email    TEXT     NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  title            TEXT     NOT NULL,
  description      TEXT,
  cover_image_url  TEXT,
  thumbnail        TEXT,                         -- gradient class fallback
  published        BOOLEAN  NOT NULL DEFAULT FALSE,
  enrollment_count INTEGER  NOT NULL DEFAULT 0,
  created_at       BIGINT   DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── modules ─────────────────────────────────────────────────────────────────
-- Intentionally named "modules" (not course_modules) to match app-store queries
CREATE TABLE IF NOT EXISTS modules (
  id         BIGINT  PRIMARY KEY,
  course_id  BIGINT  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ─── lessons ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id          BIGINT   PRIMARY KEY,
  module_id   BIGINT   NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id   BIGINT   NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       TEXT     NOT NULL,
  description TEXT,
  video_url   TEXT,
  published   BOOLEAN  NOT NULL DEFAULT FALSE,
  sort_order  INTEGER  NOT NULL DEFAULT 0,
  drip_days   INTEGER  NOT NULL DEFAULT 0
);

-- ─── lesson_resources ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_resources (
  id        BIGINT  PRIMARY KEY,
  lesson_id BIGINT  NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title     TEXT    NOT NULL,
  url       TEXT    NOT NULL,
  source    TEXT    NOT NULL DEFAULT 'other',
  added_at  BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── enrollments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  course_id             BIGINT   NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_email            TEXT     NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  completed_lesson_ids  BIGINT[] NOT NULL DEFAULT '{}',
  enrolled_at           BIGINT   DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
  PRIMARY KEY (course_id, user_email)
);

-- ─── community_resources ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_resources (
  id           BIGINT  PRIMARY KEY,
  community_id BIGINT  NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  url          TEXT    NOT NULL,
  source       TEXT    NOT NULL DEFAULT 'other',
  added_at     BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── community_events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_events (
  id           BIGINT  PRIMARY KEY,
  community_id BIGINT  NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  event_date   TEXT    NOT NULL,
  event_time   TEXT,
  type         TEXT    NOT NULL DEFAULT 'session' CHECK (type IN ('session','deadline','meetup','personal')),
  created_at   BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── access_records ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_records (
  id             BIGINT  PRIMARY KEY,
  resource_id    BIGINT  NOT NULL,
  resource_title TEXT    NOT NULL,
  resource_type  TEXT    NOT NULL CHECK (resource_type IN ('lesson','community')),
  community_id   BIGINT  REFERENCES communities(id) ON DELETE SET NULL,
  user_email     TEXT    NOT NULL,
  accessed_at    BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT   PRIMARY KEY,
  user_email TEXT     NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  text       TEXT     NOT NULL,
  time       TEXT     NOT NULL DEFAULT 'Just now',
  read       BOOLEAN  NOT NULL DEFAULT FALSE,
  created_at BIGINT   DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- ─── payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           BIGINT   PRIMARY KEY,
  community_id BIGINT   REFERENCES communities(id) ON DELETE SET NULL,
  from_email   TEXT     NOT NULL,
  to_email     TEXT     NOT NULL,
  reference    TEXT     NOT NULL,
  amount_cents INTEGER  NOT NULL CHECK (amount_cents > 0),
  currency     TEXT     NOT NULL DEFAULT 'NGN',
  status       TEXT     NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','refunded','failed')),
  created_at   BIGINT   DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);


-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES  (critical for millions-of-users scale)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_communities_creator     ON communities(creator_email);
CREATE INDEX IF NOT EXISTS idx_communities_category    ON communities(category);
CREATE INDEX IF NOT EXISTS idx_joined_communities_user ON joined_communities(user_email);
CREATE INDEX IF NOT EXISTS idx_posts_community         ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at        ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_liked_posts_user        ON liked_posts(user_email);
CREATE INDEX IF NOT EXISTS idx_comments_post           ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post          ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_dm_from                 ON direct_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_dm_to                   ON direct_messages(to_email);
CREATE INDEX IF NOT EXISTS idx_dm_created_at           ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_creator         ON courses(creator_email);
CREATE INDEX IF NOT EXISTS idx_courses_community       ON courses(community_id);
CREATE INDEX IF NOT EXISTS idx_modules_course          ON modules(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_module          ON lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_course          ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson ON lesson_resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user        ON enrollments(user_email);
CREATE INDEX IF NOT EXISTS idx_enrollments_course      ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_community_resources     ON community_resources(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events        ON community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_access_records_user     ON access_records(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications(user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_to             ON payments(to_email);


-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY  (required for production — enables per-user data isolation)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE joined_communities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_resources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read, only owner can write
CREATE POLICY IF NOT EXISTS "profiles_read_all"  ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "profiles_own_write" ON profiles FOR ALL    USING (id = auth.uid());

-- communities: everyone reads public ones; only creator can modify
CREATE POLICY IF NOT EXISTS "communities_read"   ON communities FOR SELECT USING (is_private = false OR creator_email = auth.email());
CREATE POLICY IF NOT EXISTS "communities_write"  ON communities FOR ALL    USING (creator_email = auth.email());

-- joined_communities: read own joins; insert own
CREATE POLICY IF NOT EXISTS "joined_communities_read"   ON joined_communities FOR SELECT USING (user_email = auth.email());
CREATE POLICY IF NOT EXISTS "joined_communities_insert" ON joined_communities FOR INSERT WITH CHECK (user_email = auth.email());
CREATE POLICY IF NOT EXISTS "joined_communities_delete" ON joined_communities FOR DELETE USING (user_email = auth.email());

-- posts: anyone reads; authenticated users insert own
CREATE POLICY IF NOT EXISTS "posts_read"   ON posts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "posts_insert" ON posts FOR INSERT WITH CHECK (auth.email() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "posts_update" ON posts FOR UPDATE USING (author = (SELECT name FROM profiles WHERE email = auth.email()));

-- liked_posts
CREATE POLICY IF NOT EXISTS "liked_posts_select" ON liked_posts FOR SELECT USING (user_email = auth.email());
CREATE POLICY IF NOT EXISTS "liked_posts_insert" ON liked_posts FOR INSERT WITH CHECK (user_email = auth.email());
CREATE POLICY IF NOT EXISTS "liked_posts_delete" ON liked_posts FOR DELETE USING (user_email = auth.email());

-- comments: all read; authenticated insert
CREATE POLICY IF NOT EXISTS "comments_read"   ON comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "comments_insert" ON comments FOR INSERT WITH CHECK (auth.email() IS NOT NULL);

-- reactions
CREATE POLICY IF NOT EXISTS "reactions_read"   ON reactions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "reactions_insert" ON reactions FOR INSERT WITH CHECK (user_email = auth.email());
CREATE POLICY IF NOT EXISTS "reactions_delete" ON reactions FOR DELETE USING (user_email = auth.email());

-- direct_messages: only participants can read; sender can insert
CREATE POLICY IF NOT EXISTS "dm_read"   ON direct_messages FOR SELECT USING (from_email = auth.email() OR to_email = auth.email());
CREATE POLICY IF NOT EXISTS "dm_insert" ON direct_messages FOR INSERT WITH CHECK (from_email = auth.email());
CREATE POLICY IF NOT EXISTS "dm_update" ON direct_messages FOR UPDATE USING (to_email = auth.email());  -- mark read

-- courses: all read published; creator manages own
CREATE POLICY IF NOT EXISTS "courses_read_published" ON courses FOR SELECT USING (published = true OR creator_email = auth.email());
CREATE POLICY IF NOT EXISTS "courses_creator_write"  ON courses FOR ALL    USING (creator_email = auth.email());

-- modules / lessons / lesson_resources: follow course owner
CREATE POLICY IF NOT EXISTS "modules_read"   ON modules FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "modules_write"  ON modules FOR ALL USING (
  course_id IN (SELECT id FROM courses WHERE creator_email = auth.email())
);
CREATE POLICY IF NOT EXISTS "lessons_read"  ON lessons FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "lessons_write" ON lessons FOR ALL USING (
  course_id IN (SELECT id FROM courses WHERE creator_email = auth.email())
);
CREATE POLICY IF NOT EXISTS "lesson_resources_read"  ON lesson_resources FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "lesson_resources_write" ON lesson_resources FOR ALL USING (
  lesson_id IN (SELECT l.id FROM lessons l JOIN courses c ON c.id = l.course_id WHERE c.creator_email = auth.email())
);

-- enrollments: own rows only
CREATE POLICY IF NOT EXISTS "enrollments_own" ON enrollments FOR ALL USING (user_email = auth.email());

-- community_resources / events: join required to read; creator to write
CREATE POLICY IF NOT EXISTS "community_resources_read"  ON community_resources FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "community_resources_write" ON community_resources FOR ALL USING (
  community_id IN (SELECT id FROM communities WHERE creator_email = auth.email())
);
CREATE POLICY IF NOT EXISTS "community_events_read"  ON community_events FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "community_events_write" ON community_events FOR ALL USING (
  community_id IN (SELECT id FROM communities WHERE creator_email = auth.email())
);

-- access_records: own only
CREATE POLICY IF NOT EXISTS "access_records_own" ON access_records FOR ALL USING (user_email = auth.email());

-- notifications: own only
CREATE POLICY IF NOT EXISTS "notifications_own" ON notifications FOR ALL USING (user_email = auth.email());

-- payments: participant can read; system inserts
CREATE POLICY IF NOT EXISTS "payments_participant" ON payments FOR SELECT USING (from_email = auth.email() OR to_email = auth.email());
CREATE POLICY IF NOT EXISTS "payments_insert"      ON payments FOR INSERT WITH CHECK (true);  -- server-side insert via service key


-- ══════════════════════════════════════════════════════════════════════════════
-- REALTIME  (enable for live DMs, feed updates, notifications)
-- ══════════════════════════════════════════════════════════════════════════════
-- Run in Supabase Dashboard → Database → Replication → enable these tables:
--   direct_messages · posts · notifications
-- Or run:
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
