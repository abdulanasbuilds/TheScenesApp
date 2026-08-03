-- ─────────────────────────────────────────────────────────────────────────────
-- SukaSpace — Monetization Schema (additive migration)
--
-- Run this in Supabase Dashboard → SQL Editor AFTER schema.sql.
-- All tables use CREATE TABLE IF NOT EXISTS — safe to re-run.
-- Indexes are created separately to avoid conflicts.
-- RLS policies are added at the bottom.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Subscription plans (seeded below) ────────────────────────────────────

create table if not exists subscription_plans (
  id                          text primary key,  -- 'free' | 'pro'
  name                        text not null,
  price_usd_cents             int  not null default 0,
  platform_fee_bps            int  not null default 700,   -- 700 = 7%
  storage_bytes               bigint not null default 0,
  instant_withdrawal_allowed  boolean not null default false,
  features                    jsonb not null default '{}',
  created_at                  timestamptz default now()
);

-- Seed: insert plans once (idempotent)
insert into subscription_plans (id, name, price_usd_cents, platform_fee_bps, storage_bytes, instant_withdrawal_allowed, features)
values
  ('free', 'Free', 0, 700, 0, false,
    '{"hosted_video": false, "hosted_files": false, "external_embeds": true, "custom_domain": false, "analytics": "basic", "affiliate": true}'::jsonb),
  ('pro', 'Pro', 4900, 300, 107374182400, true,
    '{"hosted_video": true, "hosted_files": true, "external_embeds": true, "custom_domain": true, "analytics": "advanced", "affiliate": true}'::jsonb)
on conflict (id) do nothing;

-- ─── 2. Creator subscriptions ─────────────────────────────────────────────────

create table if not exists creator_subscriptions (
  creator_email               text primary key references profiles(email) on delete cascade,
  plan_id                     text not null references subscription_plans(id) default 'free',
  status                      text not null default 'active'
                              check (status in ('active', 'past_due', 'cancelled', 'expired')),
  current_period_start        timestamptz not null default now(),
  current_period_end          timestamptz,               -- null = free (no expiry)
  paystack_subscription_code  text,
  paystack_customer_code      text,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- ─── 3. Payment transactions (enhanced, with fee tracking) ───────────────────

create table if not exists payment_transactions (
  id                  text primary key,               -- UUID we generate
  paystack_reference  text unique not null,
  payment_type        text not null
                      check (payment_type in ('community_access', 'course_access', 'pro_subscription')),
  from_email          text not null,
  to_email            text,                           -- creator; null for platform subs
  resource_id         bigint,                         -- community_id or course_id
  resource_type       text
                      check (resource_type in ('community', 'course', 'subscription', null)),
  gross_amount_cents  int not null,
  platform_fee_cents  int not null default 0,
  net_amount_cents    int not null,
  currency            text not null default 'NGN',
  status              text not null default 'pending'
                      check (status in ('pending', 'completed', 'refunded', 'failed')),
  provider            text not null default 'paystack',
  metadata            jsonb default '{}',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists idx_payment_transactions_from_email on payment_transactions(from_email);
create index if not exists idx_payment_transactions_to_email   on payment_transactions(to_email);
create index if not exists idx_payment_transactions_status     on payment_transactions(status);
create index if not exists idx_payment_transactions_reference  on payment_transactions(paystack_reference);

-- ─── 4. Earnings ledger (append-only, immutable) ─────────────────────────────

create table if not exists earnings_ledger (
  id              text primary key,
  creator_email   text not null references profiles(email) on delete cascade,
  transaction_id  text references payment_transactions(id),
  entry_type      text not null
                  check (entry_type in ('revenue', 'platform_fee', 'withdrawal', 'reversal', 'adjustment')),
  amount_cents    int not null,   -- positive = credit, negative = debit
  currency        text not null default 'NGN',
  balance_after_cents int not null,
  description     text,
  created_at      timestamptz default now()
);

create index if not exists idx_earnings_ledger_creator on earnings_ledger(creator_email, created_at desc);
create index if not exists idx_earnings_ledger_type    on earnings_ledger(entry_type);

-- ─── 5. Withdrawal requests ───────────────────────────────────────────────────

create table if not exists withdrawal_requests (
  id                   text primary key,
  creator_email        text not null references profiles(email) on delete cascade,
  amount_cents         int not null,
  currency             text not null default 'NGN',
  withdrawal_type      text not null default 'standard'
                       check (withdrawal_type in ('standard', 'instant')),
  fee_cents            int not null default 0,
  net_amount_cents     int not null,
  bank_code            text,
  bank_account_number  text,
  bank_account_name    text,
  status               text not null default 'pending'
                       check (status in ('pending', 'processing', 'paid', 'failed', 'reversed')),
  paystack_transfer_code text,
  failure_reason       text,
  requested_at         timestamptz default now(),
  processed_at         timestamptz,
  updated_at           timestamptz default now()
);

create index if not exists idx_withdrawal_requests_creator on withdrawal_requests(creator_email, requested_at desc);
create index if not exists idx_withdrawal_requests_status  on withdrawal_requests(status);

-- ─── 6. Storage usage ─────────────────────────────────────────────────────────

create table if not exists storage_usage (
  creator_email  text primary key references profiles(email) on delete cascade,
  used_bytes     bigint not null default 0,
  quota_bytes    bigint not null default 0,             -- set from plan on signup/upgrade
  updated_at     timestamptz default now()
);

-- ─── 7. Course access (granted after verified payment) ───────────────────────

create table if not exists course_access (
  id              text primary key,
  course_id       bigint not null references courses(id) on delete cascade,
  user_email      text not null references profiles(email) on delete cascade,
  transaction_id  text references payment_transactions(id),
  access_type     text not null default 'paid'
                  check (access_type in ('paid', 'free', 'invited', 'creator')),
  granted_at      timestamptz default now(),
  expires_at      timestamptz,   -- null = lifetime
  unique(course_id, user_email)
);

create index if not exists idx_course_access_user on course_access(user_email);

-- ─── 8. Community access ──────────────────────────────────────────────────────

create table if not exists community_access (
  id              text primary key,
  community_id    bigint not null references communities(id) on delete cascade,
  user_email      text not null references profiles(email) on delete cascade,
  transaction_id  text references payment_transactions(id),
  access_type     text not null default 'paid'
                  check (access_type in ('paid', 'free', 'invited', 'creator')),
  granted_at      timestamptz default now(),
  expires_at      timestamptz,
  unique(community_id, user_email)
);

create index if not exists idx_community_access_user on community_access(user_email);

-- ─── 9. Webhook events (idempotency log) ─────────────────────────────────────

create table if not exists webhook_events (
  id            text primary key,   -- Paystack event.id (deduplication key)
  provider      text not null default 'paystack',
  event_type    text not null,
  raw_payload   text not null,
  processed     boolean not null default false,
  processed_at  timestamptz,
  error         text,
  created_at    timestamptz default now()
);

create index if not exists idx_webhook_events_processed on webhook_events(processed, created_at);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table subscription_plans       enable row level security;
alter table creator_subscriptions    enable row level security;
alter table payment_transactions     enable row level security;
alter table earnings_ledger          enable row level security;
alter table withdrawal_requests      enable row level security;
alter table storage_usage            enable row level security;
alter table course_access            enable row level security;
alter table community_access         enable row level security;
alter table webhook_events           enable row level security;

-- subscription_plans: everyone can read (it's a public catalog)
create policy "anyone can read plans"
  on subscription_plans for select using (true);

-- creator_subscriptions: creators can only see their own
create policy "creators read own subscription"
  on creator_subscriptions for select
  using (auth.role() = 'authenticated' and auth.email() = creator_email);

-- payment_transactions: participants can read their own transactions
create policy "participants read own transactions"
  on payment_transactions for select
  using (auth.role() = 'authenticated'
    and (auth.email() = from_email or auth.email() = to_email));

-- earnings_ledger: creator reads their own ledger
create policy "creators read own earnings"
  on earnings_ledger for select
  using (auth.role() = 'authenticated' and auth.email() = creator_email);

-- withdrawal_requests: creator reads their own
create policy "creators read own withdrawals"
  on withdrawal_requests for select
  using (auth.role() = 'authenticated' and auth.email() = creator_email);

-- storage_usage: creator reads their own
create policy "creators read own storage"
  on storage_usage for select
  using (auth.role() = 'authenticated' and auth.email() = creator_email);

-- course_access: learner reads their own access records
create policy "users read own course access"
  on course_access for select
  using (auth.role() = 'authenticated' and auth.email() = user_email);

-- community_access: user reads their own community access
create policy "users read own community access"
  on community_access for select
  using (auth.role() = 'authenticated' and auth.email() = user_email);

-- webhook_events: server-only — no client access
-- (service-role key bypasses RLS, so the server can still write)
create policy "no client access to webhook events"
  on webhook_events for all using (false);

-- ─── Helpful views ────────────────────────────────────────────────────────────

-- Creator wallet summary (current balance from ledger)
create or replace view creator_wallet as
select
  creator_email,
  currency,
  coalesce(sum(amount_cents) filter (where entry_type = 'revenue'), 0) as gross_earned_cents,
  coalesce(sum(amount_cents) filter (where entry_type = 'platform_fee'), 0) as total_fees_cents,
  coalesce(sum(amount_cents) filter (where entry_type = 'withdrawal'), 0) as total_withdrawn_cents,
  coalesce(sum(amount_cents), 0) as balance_cents,   -- net of all entries
  max(created_at) as last_transaction_at
from earnings_ledger
group by creator_email, currency;
