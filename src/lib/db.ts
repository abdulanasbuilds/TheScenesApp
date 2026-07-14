/**
 * Database schema for SukaSpace
 *
 * Runtime: Replit native PostgreSQL (DATABASE_URL is already set in env).
 * This module exports the SQL migration + TypeScript types for every table.
 *
 * To run the migration on the Replit PostgreSQL database, call `initDb()`.
 * In a future TanStack Start server-function layer, replace localStorage reads
 * with `query()` calls from this module.
 *
 * Tables: profiles · communities · courses · enrollments · messages · payments · notifications
 */

// ─── TypeScript types ─────────────────────────────────────────────────────────

export type DbProfile = {
  id: string;
  email: string;
  name: string;
  role: "creator" | "learner";
  avatar: string | null;
  bio: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbCommunity = {
  id: number;
  title: string;
  summary: string | null;
  category: string;
  tag: "FREE" | "PAID";
  price: string | null;
  creator_email: string;
  members_count: number;
  avatar: string | null;
  banner: string | null;
  created_at: string;
};

export type DbCourse = {
  id: number;
  community_id: number | null;
  creator_email: string;
  title: string;
  description: string | null;
  published: boolean;
  enrollment_count: number;
  created_at: string;
};

export type DbEnrollment = {
  id: number;
  course_id: number;
  user_email: string;
  enrolled_at: string;
};

export type DbMessage = {
  id: number;
  from_email: string;
  to_email: string | null;
  community_id: number | null;
  body: string;
  read: boolean;
  created_at: string;
};

export type DbPayment = {
  id: number;
  community_id: number | null;
  from_email: string;
  to_email: string;
  amount_cents: number;
  currency: string;
  status: "pending" | "completed" | "refunded" | "failed";
  description: string | null;
  created_at: string;
};

export type DbNotification = {
  id: number;
  user_email: string;
  text: string;
  read: boolean;
  created_at: string;
};

// ─── SQL Migration ────────────────────────────────────────────────────────────

export const MIGRATION_SQL = `
-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'learner' CHECK (role IN ('creator', 'learner')),
  avatar        TEXT,
  bio           TEXT,
  photo_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- communities
CREATE TABLE IF NOT EXISTS communities (
  id            SERIAL      PRIMARY KEY,
  title         TEXT        NOT NULL,
  summary       TEXT,
  category      TEXT        NOT NULL DEFAULT 'General',
  tag           TEXT        NOT NULL DEFAULT 'FREE' CHECK (tag IN ('FREE', 'PAID')),
  price         TEXT,
  creator_email TEXT        NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  members_count INTEGER     NOT NULL DEFAULT 1,
  avatar        TEXT,
  banner        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- courses
CREATE TABLE IF NOT EXISTS courses (
  id               SERIAL   PRIMARY KEY,
  community_id     INTEGER  REFERENCES communities(id) ON DELETE SET NULL,
  creator_email    TEXT     NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  title            TEXT     NOT NULL,
  description      TEXT,
  published        BOOLEAN  NOT NULL DEFAULT FALSE,
  enrollment_count INTEGER  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- course_modules
CREATE TABLE IF NOT EXISTS course_modules (
  id          SERIAL  PRIMARY KEY,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  "order"     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- lessons
CREATE TABLE IF NOT EXISTS lessons (
  id          SERIAL   PRIMARY KEY,
  module_id   INTEGER  NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title       TEXT     NOT NULL,
  description TEXT,
  video_url   TEXT,
  published   BOOLEAN  NOT NULL DEFAULT FALSE,
  "order"     INTEGER  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- lesson_resources
CREATE TABLE IF NOT EXISTS lesson_resources (
  id         SERIAL  PRIMARY KEY,
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  url        TEXT    NOT NULL,
  source     TEXT    NOT NULL DEFAULT 'other',
  added_at   TIMESTAMPTZ DEFAULT NOW()
);

-- enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id          SERIAL   PRIMARY KEY,
  course_id   INTEGER  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_email  TEXT     NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, user_email)
);

-- enrollment_progress (lesson completions)
CREATE TABLE IF NOT EXISTS enrollment_progress (
  id          SERIAL  PRIMARY KEY,
  course_id   INTEGER NOT NULL,
  user_email  TEXT    NOT NULL,
  lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, user_email, lesson_id)
);

-- community_members
CREATE TABLE IF NOT EXISTS community_members (
  id           SERIAL  PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_email   TEXT    NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_email)
);

-- community_resources
CREATE TABLE IF NOT EXISTS community_resources (
  id           SERIAL  PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  url          TEXT    NOT NULL,
  source       TEXT    NOT NULL DEFAULT 'other',
  added_by     TEXT    NOT NULL,
  added_at     TIMESTAMPTZ DEFAULT NOW()
);

-- messages (DMs + community posts)
CREATE TABLE IF NOT EXISTS messages (
  id           SERIAL   PRIMARY KEY,
  from_email   TEXT     NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  to_email     TEXT     REFERENCES profiles(email) ON DELETE SET NULL,
  community_id INTEGER  REFERENCES communities(id) ON DELETE CASCADE,
  body         TEXT     NOT NULL,
  read         BOOLEAN  NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id           SERIAL   PRIMARY KEY,
  community_id INTEGER  REFERENCES communities(id) ON DELETE SET NULL,
  from_email   TEXT     NOT NULL,
  to_email     TEXT     NOT NULL,
  amount_cents INTEGER  NOT NULL CHECK (amount_cents > 0),
  currency     TEXT     NOT NULL DEFAULT 'USD',
  status       TEXT     NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','refunded','failed')),
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL   PRIMARY KEY,
  user_email  TEXT     NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  text        TEXT     NOT NULL,
  read        BOOLEAN  NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- access_records (resource analytics)
CREATE TABLE IF NOT EXISTS access_records (
  id             SERIAL   PRIMARY KEY,
  resource_id    INTEGER  NOT NULL,
  resource_title TEXT     NOT NULL,
  resource_type  TEXT     NOT NULL CHECK (resource_type IN ('lesson','community')),
  community_id   INTEGER  REFERENCES communities(id) ON DELETE SET NULL,
  user_email     TEXT     NOT NULL,
  accessed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_communities_creator ON communities(creator_email);
CREATE INDEX IF NOT EXISTS idx_courses_creator     ON courses(creator_email);
CREATE INDEX IF NOT EXISTS idx_courses_community   ON courses(community_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user    ON enrollments(user_email);
CREATE INDEX IF NOT EXISTS idx_enrollments_course  ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_messages_from       ON messages(from_email);
CREATE INDEX IF NOT EXISTS idx_messages_to         ON messages(to_email);
CREATE INDEX IF NOT EXISTS idx_notifications_user  ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_to         ON payments(to_email);
CREATE INDEX IF NOT EXISTS idx_access_user         ON access_records(user_email);
`;

/**
 * How to run the migration:
 *
 *   import postgres from "postgres";
 *   const sql = postgres(process.env.DATABASE_URL!);
 *   await sql.unsafe(MIGRATION_SQL);
 *   await sql.end();
 *
 * Or paste MIGRATION_SQL into the Replit Database tool's SQL console.
 *
 * To connect Supabase instead:
 *   1. Create a Supabase project at supabase.com
 *   2. Set SUPABASE_URL and SUPABASE_ANON_KEY in Replit Secrets
 *   3. Replace the above with:
 *      import { createClient } from "@supabase/supabase-js";
 *      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 */
