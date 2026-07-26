-- ═══════════════════════════════════════════════════════════════════
-- SukaSpace — consolidated production schema
-- ═══════════════════════════════════════════════════════════════════

-- ─── profiles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  name        text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'learner' CHECK (role IN ('creator','learner')),
  avatar      text,
  photo_url   text,
  bio         text,
  location    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(COALESCE(NEW.email,'user@'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'learner'),
    upper(left(COALESCE(NEW.raw_user_meta_data ->> 'name', COALESCE(NEW.email,'U')), 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ─── communities ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communities (
  id                  bigint PRIMARY KEY,
  title               text NOT NULL,
  category            text,
  members             int NOT NULL DEFAULT 1,
  creator             text,
  creator_email       text NOT NULL,
  avatar              text,
  banner              text,
  tag                 text NOT NULL DEFAULT 'FREE' CHECK (tag IN ('FREE','PAID')),
  price               text,
  price_model         text NOT NULL DEFAULT 'free' CHECK (price_model IN ('free','subscription','freemium','tiered','one_time')),
  summary             text,
  color               text DEFAULT '#0284C7',
  cover_image_url     text,
  icon_url            text,
  is_private          boolean NOT NULL DEFAULT false,
  discovery_keywords  text[] NOT NULL DEFAULT '{}',
  screening_questions text[] NOT NULL DEFAULT '{}',
  welcome_message     text,
  required_action     text,
  pinned_post_id      bigint,
  created_at          bigint NOT NULL,
  CONSTRAINT communities_keywords_max_11 CHECK (array_length(discovery_keywords,1) IS NULL OR array_length(discovery_keywords,1) <= 11),
  CONSTRAINT communities_screening_max_3 CHECK (array_length(screening_questions,1) IS NULL OR array_length(screening_questions,1) <= 3)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT ON public.communities TO anon;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_communities_keywords ON public.communities USING GIN (discovery_keywords);
CREATE POLICY "communities_public_read" ON public.communities FOR SELECT USING (is_private = false);
CREATE POLICY "communities_insert_own" ON public.communities FOR INSERT TO authenticated WITH CHECK (creator_email = auth.email());
CREATE POLICY "communities_update_own" ON public.communities FOR UPDATE TO authenticated USING (creator_email = auth.email());
CREATE POLICY "communities_delete_own" ON public.communities FOR DELETE TO authenticated USING (creator_email = auth.email());

-- ─── memberships ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.joined_communities (
  community_id bigint NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_email   text NOT NULL,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_email)
);
GRANT SELECT, INSERT, DELETE ON public.joined_communities TO authenticated;
GRANT SELECT ON public.joined_communities TO anon;
GRANT ALL ON public.joined_communities TO service_role;
ALTER TABLE public.joined_communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships_read" ON public.joined_communities FOR SELECT USING (true);
CREATE POLICY "memberships_join_self" ON public.joined_communities FOR INSERT TO authenticated WITH CHECK (user_email = auth.email());
CREATE POLICY "memberships_leave_self" ON public.joined_communities FOR DELETE TO authenticated USING (user_email = auth.email());

CREATE POLICY "communities_member_read" ON public.communities FOR SELECT TO authenticated
  USING (creator_email = auth.email() OR EXISTS (
    SELECT 1 FROM public.joined_communities j WHERE j.community_id = communities.id AND j.user_email = auth.email()));

-- ─── posts / comments / reactions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id           bigint PRIMARY KEY,
  community_id bigint REFERENCES public.communities(id) ON DELETE CASCADE,
  channel      text NOT NULL DEFAULT 'general',
  author       text,
  author_email text,
  role         text,
  avatar       text,
  title        text,
  category     text,
  likes        int NOT NULL DEFAULT 0,
  comments     int NOT NULL DEFAULT 0,
  body         text NOT NULL,
  pinned       boolean NOT NULL DEFAULT false,
  created_at   bigint NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_posts_community ON public.posts(community_id, created_at DESC);
CREATE POLICY "posts_read" ON public.posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.communities c WHERE c.id = posts.community_id AND c.is_private = false)
  OR EXISTS (SELECT 1 FROM public.joined_communities j WHERE j.community_id = posts.community_id AND j.user_email = auth.email()));
CREATE POLICY "posts_write" ON public.posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "posts_update" ON public.posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE TO authenticated USING (author_email = auth.email() OR author_email IS NULL);

CREATE TABLE IF NOT EXISTS public.liked_posts (
  post_id    bigint NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  PRIMARY KEY (post_id, user_email)
);
GRANT SELECT, INSERT, DELETE ON public.liked_posts TO authenticated;
GRANT SELECT ON public.liked_posts TO anon;
GRANT ALL ON public.liked_posts TO service_role;
ALTER TABLE public.liked_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_read" ON public.liked_posts FOR SELECT USING (true);
CREATE POLICY "likes_write_self" ON public.liked_posts FOR INSERT TO authenticated WITH CHECK (user_email = auth.email());
CREATE POLICY "likes_delete_self" ON public.liked_posts FOR DELETE TO authenticated USING (user_email = auth.email());

CREATE TABLE IF NOT EXISTS public.comments (
  id           bigint PRIMARY KEY,
  post_id      bigint REFERENCES public.posts(id) ON DELETE CASCADE,
  author       text,
  author_email text,
  avatar       text,
  body         text NOT NULL,
  created_at   bigint NOT NULL
);
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_write" ON public.comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (author_email = auth.email() OR author_email IS NULL);

CREATE TABLE IF NOT EXISTS public.reactions (
  post_id    bigint NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  emoji      text NOT NULL,
  PRIMARY KEY (post_id, user_email, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;
GRANT SELECT ON public.reactions TO anon;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_read" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "reactions_write_self" ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_email = auth.email());
CREATE POLICY "reactions_delete_self" ON public.reactions FOR DELETE TO authenticated USING (user_email = auth.email());

-- ─── classroom ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id               bigint PRIMARY KEY,
  community_id     bigint REFERENCES public.communities(id) ON DELETE SET NULL,
  title            text NOT NULL,
  description      text,
  creator_email    text NOT NULL,
  cover_image_url  text,
  thumbnail        text,
  price            text,
  published        boolean NOT NULL DEFAULT false,
  published_at     timestamptz,
  enrollment_count int NOT NULL DEFAULT 0,
  created_at       bigint NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT ON public.courses TO anon;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(creator_email, published);
CREATE POLICY "courses_read_published" ON public.courses FOR SELECT USING (published = true);
CREATE POLICY "courses_read_own" ON public.courses FOR SELECT TO authenticated USING (creator_email = auth.email());
CREATE POLICY "courses_write_own" ON public.courses FOR INSERT TO authenticated WITH CHECK (creator_email = auth.email());
CREATE POLICY "courses_update_own" ON public.courses FOR UPDATE TO authenticated USING (creator_email = auth.email());
CREATE POLICY "courses_delete_own" ON public.courses FOR DELETE TO authenticated USING (creator_email = auth.email());

CREATE TABLE IF NOT EXISTS public.modules (
  id         bigint PRIMARY KEY,
  course_id  bigint REFERENCES public.courses(id) ON DELETE CASCADE,
  title      text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT SELECT ON public.modules TO anon;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_read" ON public.modules FOR SELECT USING (true);
CREATE POLICY "modules_manage" ON public.modules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = modules.course_id AND c.creator_email = auth.email()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = modules.course_id AND c.creator_email = auth.email()));

CREATE TABLE IF NOT EXISTS public.lessons (
  id          bigint PRIMARY KEY,
  module_id   bigint REFERENCES public.modules(id) ON DELETE CASCADE,
  course_id   bigint REFERENCES public.courses(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  body        text,
  video_url   text,
  published   boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0,
  drip_days   int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT SELECT ON public.lessons TO anon;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_read" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "lessons_manage" ON public.lessons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND c.creator_email = auth.email()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND c.creator_email = auth.email()));

CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id        bigint PRIMARY KEY,
  lesson_id bigint REFERENCES public.lessons(id) ON DELETE CASCADE,
  title     text NOT NULL,
  url       text NOT NULL,
  source    text DEFAULT 'other',
  added_at  bigint NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_resources TO authenticated;
GRANT SELECT ON public.lesson_resources TO anon;
GRANT ALL ON public.lesson_resources TO service_role;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_resources_read" ON public.lesson_resources FOR SELECT USING (true);
CREATE POLICY "lesson_resources_manage" ON public.lesson_resources FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.community_resources (
  id           bigint PRIMARY KEY,
  community_id bigint REFERENCES public.communities(id) ON DELETE CASCADE,
  title        text NOT NULL,
  url          text NOT NULL,
  source       text DEFAULT 'other',
  added_at     bigint NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_resources TO authenticated;
GRANT SELECT ON public.community_resources TO anon;
GRANT ALL ON public.community_resources TO service_role;
ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_resources_read" ON public.community_resources FOR SELECT USING (true);
CREATE POLICY "community_resources_manage" ON public.community_resources FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.enrollments (
  course_id            bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_email           text NOT NULL,
  completed_lesson_ids bigint[] NOT NULL DEFAULT '{}',
  enrolled_at          bigint NOT NULL,
  PRIMARY KEY (course_id, user_email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_own" ON public.enrollments FOR ALL TO authenticated USING (user_email = auth.email()) WITH CHECK (user_email = auth.email());

-- ─── calendar ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_events (
  id             bigint PRIMARY KEY,
  community_id   bigint REFERENCES public.communities(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  event_date     text NOT NULL,
  event_time     text,
  type           text NOT NULL DEFAULT 'session' CHECK (type IN ('session','deadline','meetup','personal')),
  recurrence     text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekly','monthly')),
  meeting_url    text,
  location       text,
  remind_1d      boolean NOT NULL DEFAULT true,
  created_by     text,
  created_at     bigint NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_events TO authenticated;
GRANT SELECT ON public.community_events TO anon;
GRANT ALL ON public.community_events TO service_role;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_read" ON public.community_events FOR SELECT USING (true);
CREATE POLICY "events_manage" ON public.community_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── gamification ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_points (
  community_id bigint NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_email   text NOT NULL,
  points       int NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_email)
);
GRANT SELECT, INSERT, UPDATE ON public.member_points TO authenticated;
GRANT SELECT ON public.member_points TO anon;
GRANT ALL ON public.member_points TO service_role;
ALTER TABLE public.member_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_read" ON public.member_points FOR SELECT USING (true);
CREATE POLICY "points_write" ON public.member_points FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.community_levels (
  id             bigint PRIMARY KEY,
  community_id   bigint NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  level_number   int NOT NULL,
  name           text NOT NULL,
  points_required int NOT NULL DEFAULT 0,
  reward         text,
  unlock_course_id bigint,
  UNIQUE (community_id, level_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_levels TO authenticated;
GRANT SELECT ON public.community_levels TO anon;
GRANT ALL ON public.community_levels TO service_role;
ALTER TABLE public.community_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels_read" ON public.community_levels FOR SELECT USING (true);
CREATE POLICY "levels_manage" ON public.community_levels FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_levels.community_id AND c.creator_email = auth.email()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_levels.community_id AND c.creator_email = auth.email()));

-- ─── notifications / DMs / onboarding ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         bigint PRIMARY KEY,
  user_email text NOT NULL,
  text       text NOT NULL,
  time       text,
  read       boolean NOT NULL DEFAULT false,
  notif_type text NOT NULL DEFAULT 'system',
  actor_name text,
  link       text,
  dedup_key  text,
  created_at bigint NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_email, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup ON public.notifications(user_email, dedup_key) WHERE dedup_key IS NOT NULL;
CREATE POLICY "notifications_own_read" ON public.notifications FOR SELECT TO authenticated USING (user_email = auth.email());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_own_update" ON public.notifications FOR UPDATE TO authenticated USING (user_email = auth.email());
CREATE POLICY "notifications_own_delete" ON public.notifications FOR DELETE TO authenticated USING (user_email = auth.email());

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_email text NOT NULL,
  notif_type text NOT NULL,
  enabled    boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_email, notif_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_prefs_own" ON public.notification_preferences FOR ALL TO authenticated USING (user_email = auth.email()) WITH CHECK (user_email = auth.email());

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id         bigint PRIMARY KEY,
  from_email text NOT NULL,
  to_email   text NOT NULL,
  body       text NOT NULL,
  read       boolean NOT NULL DEFAULT false,
  created_at bigint NOT NULL
);
GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dm_to_unread ON public.direct_messages(to_email, read) WHERE read = false;
CREATE POLICY "dm_participants_read" ON public.direct_messages FOR SELECT TO authenticated USING (auth.email() = from_email OR auth.email() = to_email);
CREATE POLICY "dm_send" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (auth.email() = from_email);
CREATE POLICY "dm_recipient_update" ON public.direct_messages FOR UPDATE TO authenticated USING (auth.email() = to_email);

CREATE TABLE IF NOT EXISTS public.onboarding_states (
  user_email   text PRIMARY KEY,
  role         text,
  interests    text[] NOT NULL DEFAULT '{}',
  goals        text[] NOT NULL DEFAULT '{}',
  skill_level  text,
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  step         int NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.onboarding_states TO authenticated;
GRANT ALL ON public.onboarding_states TO service_role;
ALTER TABLE public.onboarding_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_own" ON public.onboarding_states FOR ALL TO authenticated USING (user_email = auth.email()) WITH CHECK (user_email = auth.email());

CREATE TABLE IF NOT EXISTS public.community_announcements (
  id            bigint PRIMARY KEY,
  community_id  bigint NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  creator_email text NOT NULL,
  title         text NOT NULL,
  body          text NOT NULL,
  sent_at       timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.community_announcements TO authenticated;
GRANT SELECT ON public.community_announcements TO anon;
GRANT ALL ON public.community_announcements TO service_role;
ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_read" ON public.community_announcements FOR SELECT USING (true);
CREATE POLICY "announcements_write" ON public.community_announcements FOR INSERT TO authenticated WITH CHECK (creator_email = auth.email());

CREATE TABLE IF NOT EXISTS public.access_records (
  id             bigint PRIMARY KEY,
  resource_id    bigint,
  resource_title text,
  resource_type  text CHECK (resource_type IN ('lesson','community')),
  community_id   bigint,
  user_email     text,
  accessed_at    bigint NOT NULL
);
GRANT SELECT, INSERT ON public.access_records TO authenticated;
GRANT ALL ON public.access_records TO service_role;
ALTER TABLE public.access_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "access_records_own" ON public.access_records FOR ALL TO authenticated USING (user_email = auth.email()) WITH CHECK (user_email = auth.email());

-- ═══ MONETIZATION ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id                         text PRIMARY KEY,
  name                       text NOT NULL,
  price_usd_cents            int NOT NULL DEFAULT 0,
  platform_fee_bps           int NOT NULL DEFAULT 700,
  storage_bytes              bigint NOT NULL DEFAULT 0,
  instant_withdrawal_allowed boolean NOT NULL DEFAULT false,
  features                   jsonb NOT NULL DEFAULT '{}'
);
GRANT SELECT ON public.subscription_plans TO authenticated, anon;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_read" ON public.subscription_plans FOR SELECT USING (true);
INSERT INTO public.subscription_plans (id,name,price_usd_cents,platform_fee_bps,storage_bytes,instant_withdrawal_allowed,features) VALUES
  ('free','Free',0,700,0,false,'{"hosted_video":false,"hosted_files":false,"external_embeds":true,"analytics":"basic"}'::jsonb),
  ('pro','Pro',4900,0,107374182400,true,'{"hosted_video":true,"hosted_files":true,"external_embeds":true,"analytics":"advanced"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
  creator_email              text PRIMARY KEY,
  plan_id                    text NOT NULL DEFAULT 'free' REFERENCES public.subscription_plans(id),
  status                     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','expired')),
  current_period_start       timestamptz NOT NULL DEFAULT now(),
  current_period_end         timestamptz,
  paystack_subscription_code text,
  paystack_customer_code     text,
  updated_at                 timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.creator_subscriptions TO authenticated;
GRANT ALL ON public.creator_subscriptions TO service_role;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_read_own" ON public.creator_subscriptions FOR SELECT TO authenticated USING (creator_email = auth.email());

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                 text PRIMARY KEY,
  paystack_reference text UNIQUE NOT NULL,
  payment_type       text NOT NULL CHECK (payment_type IN ('community_access','course_access','pro_subscription')),
  from_email         text NOT NULL,
  to_email           text,
  resource_id        bigint,
  resource_type      text,
  gross_amount_cents int NOT NULL,
  platform_fee_cents int NOT NULL DEFAULT 0,
  net_amount_cents   int NOT NULL,
  currency           text NOT NULL DEFAULT 'NGN',
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','refunded','failed')),
  provider           text NOT NULL DEFAULT 'paystack',
  metadata           jsonb NOT NULL DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_tx_from ON public.payment_transactions(from_email);
CREATE INDEX IF NOT EXISTS idx_tx_to ON public.payment_transactions(to_email);
CREATE POLICY "tx_read_participant" ON public.payment_transactions FOR SELECT TO authenticated
  USING (auth.email() = from_email OR auth.email() = to_email);

CREATE TABLE IF NOT EXISTS public.earnings_ledger (
  id                  text PRIMARY KEY,
  creator_email       text NOT NULL,
  transaction_id      text REFERENCES public.payment_transactions(id),
  entry_type          text NOT NULL CHECK (entry_type IN ('revenue','platform_fee','withdrawal','reversal','adjustment')),
  amount_cents        int NOT NULL,
  currency            text NOT NULL DEFAULT 'NGN',
  balance_after_cents int NOT NULL DEFAULT 0,
  description         text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.earnings_ledger TO authenticated;
GRANT ALL ON public.earnings_ledger TO service_role;
ALTER TABLE public.earnings_ledger ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ledger_creator ON public.earnings_ledger(creator_email, created_at DESC);
CREATE POLICY "ledger_read_own" ON public.earnings_ledger FOR SELECT TO authenticated USING (creator_email = auth.email());

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id                     text PRIMARY KEY,
  creator_email          text NOT NULL,
  amount_cents           int NOT NULL,
  currency               text NOT NULL DEFAULT 'NGN',
  withdrawal_type        text NOT NULL DEFAULT 'standard' CHECK (withdrawal_type IN ('standard','instant')),
  fee_cents              int NOT NULL DEFAULT 0,
  net_amount_cents       int NOT NULL,
  bank_code              text,
  bank_account_number    text,
  bank_account_name      text,
  status                 text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed','reversed')),
  paystack_transfer_code text,
  failure_reason         text,
  requested_at           timestamptz NOT NULL DEFAULT now(),
  processed_at           timestamptz,
  updated_at             timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_wd_creator ON public.withdrawal_requests(creator_email, requested_at DESC);
CREATE POLICY "wd_read_own" ON public.withdrawal_requests FOR SELECT TO authenticated USING (creator_email = auth.email());

CREATE TABLE IF NOT EXISTS public.storage_usage (
  creator_email text PRIMARY KEY,
  used_bytes    bigint NOT NULL DEFAULT 0,
  quota_bytes   bigint NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.storage_usage TO authenticated;
GRANT ALL ON public.storage_usage TO service_role;
ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "storage_read_own" ON public.storage_usage FOR SELECT TO authenticated USING (creator_email = auth.email());

CREATE TABLE IF NOT EXISTS public.course_access (
  id             text PRIMARY KEY,
  course_id      bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_email     text NOT NULL,
  transaction_id text REFERENCES public.payment_transactions(id),
  access_type    text NOT NULL DEFAULT 'paid' CHECK (access_type IN ('paid','free','invited','creator')),
  granted_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz,
  UNIQUE (course_id, user_email)
);
GRANT SELECT ON public.course_access TO authenticated;
GRANT ALL ON public.course_access TO service_role;
ALTER TABLE public.course_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_access_read_own" ON public.course_access FOR SELECT TO authenticated USING (user_email = auth.email());

CREATE TABLE IF NOT EXISTS public.community_access (
  id             text PRIMARY KEY,
  community_id   bigint NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_email     text NOT NULL,
  transaction_id text REFERENCES public.payment_transactions(id),
  access_type    text NOT NULL DEFAULT 'paid' CHECK (access_type IN ('paid','free','invited','creator')),
  granted_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz,
  UNIQUE (community_id, user_email)
);
GRANT SELECT ON public.community_access TO authenticated;
GRANT ALL ON public.community_access TO service_role;
ALTER TABLE public.community_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_access_read_own" ON public.community_access FOR SELECT TO authenticated USING (user_email = auth.email());

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           text PRIMARY KEY,
  provider     text NOT NULL DEFAULT 'paystack',
  event_type   text NOT NULL,
  raw_payload  text NOT NULL,
  processed    boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- creator wallet view
CREATE OR REPLACE VIEW public.creator_wallet
WITH (security_invoker = true) AS
SELECT
  creator_email,
  currency,
  COALESCE(SUM(amount_cents) FILTER (WHERE entry_type = 'revenue'), 0)      AS gross_earned_cents,
  COALESCE(SUM(amount_cents) FILTER (WHERE entry_type = 'platform_fee'), 0) AS total_fees_cents,
  COALESCE(SUM(amount_cents) FILTER (WHERE entry_type = 'withdrawal'), 0)   AS total_withdrawn_cents,
  COALESCE(SUM(amount_cents), 0)                                            AS balance_cents,
  MAX(created_at)                                                           AS last_transaction_at
FROM public.earnings_ledger
GROUP BY creator_email, currency;
GRANT SELECT ON public.creator_wallet TO authenticated;
GRANT ALL ON public.creator_wallet TO service_role;

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;