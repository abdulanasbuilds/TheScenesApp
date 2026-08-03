-- ══════════════════════════════════════════════════════════════════════════════
-- SukaSpace — Monetization Schema
-- Run AFTER schema.sql.  Safe to re-run — every statement is idempotent.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── feedback ─────────────────────────────────────────────────────────────────
-- Referenced by feedback.functions.ts and the RLS block in schema.sql
CREATE TABLE IF NOT EXISTS feedback (
  id          BIGINT       PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  user_email  TEXT,
  message     TEXT         NOT NULL,
  category    TEXT         NOT NULL DEFAULT 'general',
  page        TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- ─── payment_transactions ─────────────────────────────────────────────────────
-- Server-verified Paystack charges, stored idempotently by paystack_reference.
-- Column names match what monetization.functions.ts reads and writes.
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                  TEXT        PRIMARY KEY,          -- e.g. "txn_<timestamp>_<random>"
  paystack_reference  TEXT        UNIQUE NOT NULL,      -- Paystack reference — idempotency key
  payment_type        TEXT        NOT NULL CHECK (payment_type IN ('community_access','course_access','pro_subscription')),
  from_email          TEXT        NOT NULL,             -- payer
  to_email            TEXT,                             -- creator (NULL for pro subscription)
  resource_id         BIGINT,
  resource_type       TEXT        CHECK (resource_type IN ('community','course','subscription')),
  gross_amount_cents  INTEGER     NOT NULL CHECK (gross_amount_cents > 0),
  platform_fee_cents  INTEGER     NOT NULL DEFAULT 0,
  net_amount_cents    INTEGER     NOT NULL DEFAULT 0,
  currency            TEXT        NOT NULL DEFAULT 'NGN',
  status              TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  provider            TEXT        NOT NULL DEFAULT 'paystack',
  metadata            JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pt_from_email   ON payment_transactions(from_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_to_email     ON payment_transactions(to_email);
CREATE INDEX IF NOT EXISTS idx_pt_reference    ON payment_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_pt_status       ON payment_transactions(status);

-- ─── creator_subscriptions ────────────────────────────────────────────────────
-- Tracks which creators are on the Pro plan.
-- Uses plan_id column to match monetization.functions.ts reads/writes.
CREATE TABLE IF NOT EXISTS creator_subscriptions (
  creator_email         TEXT        PRIMARY KEY REFERENCES profiles(email) ON DELETE CASCADE,
  plan_id               TEXT        NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free','pro')),
  status                TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','trialing')),
  paystack_code         TEXT,                               -- Paystack subscription code
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── webhook_events ───────────────────────────────────────────────────────────
-- Idempotency table — prevents double-processing Paystack webhooks.
CREATE TABLE IF NOT EXISTS webhook_events (
  id           TEXT        PRIMARY KEY,              -- provider event ID / reference
  provider     TEXT        NOT NULL DEFAULT 'paystack',
  event_type   TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload      JSONB
);
CREATE INDEX IF NOT EXISTS idx_we_provider ON webhook_events(provider, processed_at DESC);

-- ─── payout_accounts ──────────────────────────────────────────────────────────
-- One payout destination per creator (bank or mobile money).
CREATE TABLE IF NOT EXISTS payout_accounts (
  creator_email          TEXT        PRIMARY KEY REFERENCES profiles(email) ON DELETE CASCADE,
  method                 TEXT        NOT NULL CHECK (method IN ('bank','mobile_money')),
  provider               TEXT        NOT NULL DEFAULT 'paystack',
  country                TEXT        NOT NULL DEFAULT 'NG',
  currency               TEXT        NOT NULL DEFAULT 'NGN',
  bank_code              TEXT,
  bank_name              TEXT,
  account_number         TEXT,                       -- sensitive — masked before returning to client
  account_name           TEXT,
  mobile_money_network   TEXT,
  mobile_money_number    TEXT,                       -- sensitive — masked before returning to client
  verification_status    TEXT        NOT NULL DEFAULT 'unverified'
                           CHECK (verification_status IN ('unverified','pending','verified','failed')),
  is_payout_ready        BOOLEAN     NOT NULL DEFAULT TRUE,
  default_withdrawal_type TEXT       NOT NULL DEFAULT 'standard'
                           CHECK (default_withdrawal_type IN ('standard','instant')),
  payout_notifications   BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── withdrawal_requests ──────────────────────────────────────────────────────
-- State machine: pending → processing → paid | failed
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id                      TEXT        PRIMARY KEY,
  creator_email           TEXT        NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  amount_cents            INTEGER     NOT NULL CHECK (amount_cents > 0),
  currency                TEXT        NOT NULL DEFAULT 'NGN',
  withdrawal_type         TEXT        NOT NULL DEFAULT 'standard'
                            CHECK (withdrawal_type IN ('standard','instant')),
  fee_cents               INTEGER     NOT NULL DEFAULT 0,
  net_amount_cents        INTEGER     NOT NULL CHECK (net_amount_cents > 0),
  bank_code               TEXT,
  bank_account_number     TEXT,
  bank_account_name       TEXT,
  status                  TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','paid','failed','reversed')),
  paystack_transfer_code  TEXT,
  failure_reason          TEXT,
  requested_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at            TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wr_creator ON withdrawal_requests(creator_email, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_wr_status  ON withdrawal_requests(status);

-- ─── earnings_ledger ──────────────────────────────────────────────────────────
-- Append-only financial ledger. Never UPDATE or DELETE rows here.
CREATE TABLE IF NOT EXISTS earnings_ledger (
  id                  TEXT        PRIMARY KEY,
  creator_email       TEXT        NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  transaction_id      TEXT        REFERENCES payment_transactions(id) ON DELETE SET NULL,
  entry_type          TEXT        NOT NULL
                        CHECK (entry_type IN ('revenue','platform_fee','withdrawal','reversal','adjustment')),
  amount_cents        INTEGER     NOT NULL,           -- positive = credit, negative = debit
  currency            TEXT        NOT NULL DEFAULT 'NGN',
  balance_after_cents INTEGER     NOT NULL,
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_el_creator    ON earnings_ledger(creator_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_el_txn        ON earnings_ledger(transaction_id);

-- ─── creator_wallet (view) ───────────────────────────────────────────────────
-- Aggregated balance and earnings summary per creator+currency.
-- Used by earnings.ts — avoids scanning the full ledger on every balance check.
CREATE OR REPLACE VIEW creator_wallet AS
SELECT
  creator_email,
  currency,
  SUM(CASE WHEN entry_type = 'revenue'      THEN amount_cents ELSE 0 END) AS gross_earned_cents,
  SUM(CASE WHEN entry_type = 'platform_fee' THEN amount_cents ELSE 0 END) AS total_fees_cents,
  SUM(CASE WHEN entry_type = 'withdrawal'   THEN amount_cents ELSE 0 END) AS total_withdrawn_cents,
  SUM(amount_cents)                                                         AS balance_cents,
  MAX(created_at)                                                           AS last_transaction_at
FROM earnings_ledger
GROUP BY creator_email, currency;

-- ─── storage_usage ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS storage_usage (
  creator_email  TEXT        PRIMARY KEY REFERENCES profiles(email) ON DELETE CASCADE,
  used_bytes     BIGINT      NOT NULL DEFAULT 0,
  quota_bytes    BIGINT      NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── community_access ────────────────────────────────────────────────────────
-- Explicit access grants for paid communities (post-payment verification).
CREATE TABLE IF NOT EXISTS community_access (
  id             TEXT        PRIMARY KEY,
  community_id   BIGINT      NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_email     TEXT        NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  transaction_id TEXT        REFERENCES payment_transactions(id) ON DELETE SET NULL,
  access_type    TEXT        NOT NULL DEFAULT 'paid'
                   CHECK (access_type IN ('paid','free','invited','creator')),
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ,
  UNIQUE (community_id, user_email)
);
CREATE INDEX IF NOT EXISTS idx_ca_user      ON community_access(user_email);
CREATE INDEX IF NOT EXISTS idx_ca_community ON community_access(community_id);

-- ─── course_access ────────────────────────────────────────────────────────────
-- Explicit access grants for paid courses.
CREATE TABLE IF NOT EXISTS course_access (
  id             TEXT        PRIMARY KEY,
  course_id      BIGINT      NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_email     TEXT        NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
  transaction_id TEXT        REFERENCES payment_transactions(id) ON DELETE SET NULL,
  access_type    TEXT        NOT NULL DEFAULT 'paid'
                   CHECK (access_type IN ('paid','free','invited','creator')),
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ,
  UNIQUE (course_id, user_email)
);
CREATE INDEX IF NOT EXISTS idx_coa_user   ON course_access(user_email);
CREATE INDEX IF NOT EXISTS idx_coa_course ON course_access(course_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- SCHEMA ADDITIONS — safe to run on an existing database
-- ══════════════════════════════════════════════════════════════════════════════

-- notifications: dedup_key prevents duplicate spam from autodm
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedup_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup ON notifications(user_email, dedup_key)
  WHERE dedup_key IS NOT NULL;

-- communities: additional creator-configurable fields
ALTER TABLE communities ADD COLUMN IF NOT EXISTS icon_url             TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS discovery_keywords   TEXT[]  NOT NULL DEFAULT '{}';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS screening_questions  JSONB;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS welcome_message      TEXT;

-- community_events: richer event metadata
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS description   TEXT;
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS host_platform TEXT;
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS meeting_url   TEXT;
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS visibility    TEXT NOT NULL DEFAULT 'members'
  CHECK (visibility IN ('members','public'));

-- profiles: interests for personalisation + onboarding completion flag
-- (these may already exist from schema.sql but are idempotent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests            TEXT[]  NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;


-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — monetization tables
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE feedback              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_ledger       ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_usage         ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_access      ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_access         ENABLE ROW LEVEL SECURITY;

-- feedback: anyone can insert; service-role reads (no SELECT policy → only admin)
CREATE POLICY IF NOT EXISTS "feedback_insert"  ON feedback FOR INSERT WITH CHECK (true);

-- payment_transactions: participants can read their own; service-role inserts
CREATE POLICY IF NOT EXISTS "pt_read_payer"   ON payment_transactions FOR SELECT USING (from_email = auth.email());
CREATE POLICY IF NOT EXISTS "pt_read_creator" ON payment_transactions FOR SELECT USING (to_email = auth.email());
CREATE POLICY IF NOT EXISTS "pt_insert"       ON payment_transactions FOR INSERT WITH CHECK (true);

-- creator_subscriptions: own row only
CREATE POLICY IF NOT EXISTS "cs_own" ON creator_subscriptions FOR ALL USING (creator_email = auth.email());

-- payout_accounts: own row only
CREATE POLICY IF NOT EXISTS "pa_own" ON payout_accounts FOR ALL USING (creator_email = auth.email());

-- withdrawal_requests: own rows
CREATE POLICY IF NOT EXISTS "wr_own" ON withdrawal_requests FOR ALL USING (creator_email = auth.email());

-- earnings_ledger: creator reads own; service-role inserts
CREATE POLICY IF NOT EXISTS "el_read"   ON earnings_ledger FOR SELECT USING (creator_email = auth.email());
CREATE POLICY IF NOT EXISTS "el_insert" ON earnings_ledger FOR INSERT WITH CHECK (true);

-- storage_usage: own row
CREATE POLICY IF NOT EXISTS "su_own" ON storage_usage FOR ALL USING (creator_email = auth.email());

-- community_access: user sees their own grants; service-role inserts
CREATE POLICY IF NOT EXISTS "ca_read"   ON community_access FOR SELECT USING (user_email = auth.email());
CREATE POLICY IF NOT EXISTS "ca_insert" ON community_access FOR INSERT WITH CHECK (true);

-- course_access: same pattern
CREATE POLICY IF NOT EXISTS "coa_read"   ON course_access FOR SELECT USING (user_email = auth.email());
CREATE POLICY IF NOT EXISTS "coa_insert" ON course_access FOR INSERT WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS — used by earnings.ts via adminDb.rpc()
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_storage_usage(p_creator_email TEXT, p_bytes BIGINT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO storage_usage (creator_email, used_bytes, quota_bytes, updated_at)
    VALUES (p_creator_email, GREATEST(0, p_bytes), 0, NOW())
  ON CONFLICT (creator_email) DO UPDATE
    SET used_bytes = GREATEST(0, storage_usage.used_bytes + p_bytes),
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION decrement_storage_usage(p_creator_email TEXT, p_bytes BIGINT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE storage_usage
    SET used_bytes = GREATEST(0, used_bytes - p_bytes),
        updated_at = NOW()
  WHERE creator_email = p_creator_email;
END;
$$;

-- ─── Notification preferences column (idempotent) ────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"posts":true,"dms":true,"comments":true,"sales":true}'::jsonb;
