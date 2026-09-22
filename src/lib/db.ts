/**
 * Database schema for The Scenes
 *
 * The canonical schema lives in src/supabase/schema.sql — paste that into
 * your Supabase SQL Editor (Dashboard → SQL Editor → New Query) to create
 * all tables, indexes, and Row Level Security policies in one shot.
 *
 * This file keeps the TypeScript types that match those tables, used by
 * server functions and any future TanStack Start data-loader layer.
 */

// ─── TypeScript types (mirrors supabase/schema.sql) ──────────────────────────

export type DbProfile = {
  id: string; // auth.users.id (UUID)
  email: string;
  name: string;
  role: "creator" | "learner";
  avatar: string | null;
  bio: string | null;
  photo_url: string | null;
  created_at: number; // epoch ms
};

export type DbCommunity = {
  id: number; // client-generated epoch ms
  title: string;
  summary: string | null;
  category: string;
  tag: "FREE" | "PAID";
  price: string | null;
  creator: string;
  creator_email: string;
  members: number;
  avatar: string | null;
  banner: string | null;
  color: string | null; // brand hex colour
  cover_image_url: string | null; // cover photo URL
  is_private: boolean;
  created_at: number;
};

export type DbCourse = {
  id: number;
  community_id: number | null;
  creator_email: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  thumbnail: string | null; // gradient-class fallback
  published: boolean;
  enrollment_count: number;
  created_at: number;
};

export type DbModule = {
  id: number;
  course_id: number;
  title: string;
  sort_order: number;
};

export type DbLesson = {
  id: number;
  module_id: number;
  course_id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  published: boolean;
  sort_order: number;
  drip_days: number;
};

export type DbLessonResource = {
  id: number;
  lesson_id: number;
  title: string;
  url: string;
  source: string;
  added_at: number;
};

export type DbEnrollment = {
  course_id: number;
  user_email: string;
  completed_lesson_ids: number[];
  enrolled_at: number;
};

export type DbPost = {
  id: number;
  community_id: number;
  channel: string;
  author: string;
  role: string;
  avatar: string | null;
  title: string;
  category: string;
  likes: number;
  comments: number;
  body: string;
  created_at: number;
};

export type DbDirectMessage = {
  id: number;
  from_email: string;
  to_email: string;
  body: string;
  read: boolean;
  created_at: number;
};

export type DbPayment = {
  id: number;
  community_id: number | null;
  from_email: string;
  to_email: string;
  reference: string;
  amount_cents: number;
  currency: string;
  status: "pending" | "completed" | "refunded" | "failed";
  created_at: number;
};

export type DbNotification = {
  id: number;
  user_email: string;
  text: string;
  time: string;
  read: boolean;
  created_at: number;
};

// ─── Migration note ───────────────────────────────────────────────────────────
//
// The complete schema (including all tables, indexes, and RLS policies) lives
// in  src/supabase/schema.sql
//
// To apply it:
//   1. Open your Supabase project → SQL Editor → New Query
//   2. Paste the contents of src/supabase/schema.sql
//   3. Click Run
//
// The schema is idempotent: every statement uses IF NOT EXISTS, so it is safe
// to re-run after future changes.
//
// ─── Supabase keys ────────────────────────────────────────────────────────────
//
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are already configured in
// .replit [userenv.shared] — no further setup is needed on Replit.
//
// For RLS write policies to work, users must be authenticated via Supabase
// Auth.  The current implementation uses localStorage-backed auth with
// Supabase writes in the background; full Supabase Auth integration is the
// next step for production hardening.
