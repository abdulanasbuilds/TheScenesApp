-- ════════════════════════════════════════════════════════════════════════════
-- SukaSpace — Production Layer Migration
-- Run AFTER schema.sql and monetization.sql
-- Adds: course visibility, notification prefs, onboarding states, indexes
-- ════════════════════════════════════════════════════════════════════════════

-- ── Course visibility columns ─────────────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS published         BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS published_at      TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS community_id      BIGINT;   -- links course to a community

-- ── Notification table enhancements ──────────────────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_name  TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link        TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notif_type  TEXT NOT NULL DEFAULT 'system';

-- ── Notification preferences ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_email   TEXT        NOT NULL,
  notif_type   TEXT        NOT NULL,
  enabled      BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_email, notif_type)
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notif prefs" ON notification_preferences;
CREATE POLICY "Users manage own notif prefs" ON notification_preferences
  USING      (user_email = (auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- ── Onboarding states ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_states (
  user_email   TEXT        PRIMARY KEY,
  role         TEXT,
  interests    TEXT[]      NOT NULL DEFAULT '{}',
  goals        TEXT[]      NOT NULL DEFAULT '{}',
  skill_level  TEXT,                              -- 'beginner' | 'intermediate' | 'advanced'
  completed    BOOLEAN     NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  step         INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE onboarding_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own onboarding" ON onboarding_states;
CREATE POLICY "Users manage own onboarding" ON onboarding_states
  USING      (user_email = (auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- ── Community announcements ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_announcements (
  id             BIGINT      PRIMARY KEY DEFAULT extract(epoch from now())::bigint * 1000 + (random() * 999)::int,
  community_id   BIGINT      NOT NULL,
  creator_email  TEXT        NOT NULL,
  title          TEXT        NOT NULL,
  body           TEXT        NOT NULL,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE community_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone in community reads announcements" ON community_announcements;
CREATE POLICY "Anyone in community reads announcements" ON community_announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creator inserts announcements" ON community_announcements;
CREATE POLICY "Creator inserts announcements" ON community_announcements FOR INSERT
  WITH CHECK (creator_email = (auth.jwt() ->> 'email'));

-- ── Performance indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_email, read)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_to_unread
  ON direct_messages (to_email, read)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_courses_published
  ON courses (creator_email, published);

CREATE INDEX IF NOT EXISTS idx_courses_community
  ON courses (community_id, published);

-- ── Idempotency guard for notifications (prevent spam) ───────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedup_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup
  ON notifications (user_email, dedup_key)
  WHERE dedup_key IS NOT NULL;
