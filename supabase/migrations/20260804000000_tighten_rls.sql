-- ─────────────────────────────────────────────────────────────────────────────
-- SukaSpace — Tighten Row Level Security Policies
-- Migration: 20260804000000_tighten_rls.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Drop old permissive policies ──────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated read/write communities" ON public.communities;
DROP POLICY IF EXISTS "authenticated read/write joined_communities" ON public.joined_communities;
DROP POLICY IF EXISTS "authenticated read/write posts" ON public.posts;
DROP POLICY IF EXISTS "authenticated read/write liked_posts" ON public.liked_posts;
DROP POLICY IF EXISTS "authenticated read/write comments" ON public.comments;
DROP POLICY IF EXISTS "authenticated read/write reactions" ON public.reactions;
DROP POLICY IF EXISTS "authenticated read/write courses" ON public.courses;
DROP POLICY IF EXISTS "authenticated read/write modules" ON public.modules;
DROP POLICY IF EXISTS "authenticated read/write lessons" ON public.lessons;
DROP POLICY IF EXISTS "authenticated read/write lesson_resources" ON public.lesson_resources;
DROP POLICY IF EXISTS "authenticated read/write community_resources" ON public.community_resources;
DROP POLICY IF EXISTS "authenticated read/write community_events" ON public.community_events;
DROP POLICY IF EXISTS "authenticated read/write enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "authenticated read/write access_records" ON public.access_records;
DROP POLICY IF EXISTS "authenticated read/write notifications" ON public.notifications;
DROP POLICY IF EXISTS "authenticated users can insert payments" ON public.payments;

-- ── 2. Create ultra-strict policies ──────────────────────────────────────────

-- ── Communities ──────────────────────────────────────────────────────────────
CREATE POLICY "anyone authenticated can read communities" ON public.communities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "creator can insert communities" ON public.communities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND creator_email = (auth.jwt() ->> 'email'));

CREATE POLICY "creator can update communities" ON public.communities
  FOR UPDATE USING (auth.role() = 'authenticated' AND creator_email = (auth.jwt() ->> 'email'));

CREATE POLICY "creator can delete communities" ON public.communities
  FOR DELETE USING (auth.role() = 'authenticated' AND creator_email = (auth.jwt() ->> 'email'));

-- ── Joined Communities ───────────────────────────────────────────────────────
CREATE POLICY "anyone authenticated can read joined communities" ON public.joined_communities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users can insert their own joined communities" ON public.joined_communities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "users can delete their own joined communities" ON public.joined_communities
  FOR DELETE USING (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

-- ── Posts ────────────────────────────────────────────────────────────────────
CREATE POLICY "anyone authenticated can read posts" ON public.posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users can insert their own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND author_email = (auth.jwt() ->> 'email'));

CREATE POLICY "author or community creator can update posts" ON public.posts
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      author_email = (auth.jwt() ->> 'email') OR
      EXISTS (
        SELECT 1 FROM public.communities
        WHERE public.communities.id = public.posts.community_id
          AND public.communities.creator_email = (auth.jwt() ->> 'email')
      )
    )
  );

CREATE POLICY "author or community creator can delete posts" ON public.posts
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      author_email = (auth.jwt() ->> 'email') OR
      EXISTS (
        SELECT 1 FROM public.communities
        WHERE public.communities.id = public.posts.community_id
          AND public.communities.creator_email = (auth.jwt() ->> 'email')
      )
    )
  );

-- ── Liked Posts ──────────────────────────────────────────────────────────────
CREATE POLICY "anyone authenticated can read liked posts" ON public.liked_posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users can insert own liked posts" ON public.liked_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "users can delete own liked posts" ON public.liked_posts
  FOR DELETE USING (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

-- ── Comments ─────────────────────────────────────────────────────────────────
CREATE POLICY "anyone authenticated can read comments" ON public.comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND author_email = (auth.jwt() ->> 'email'));

CREATE POLICY "author, post author, or creator can update comments" ON public.comments
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      author_email = (auth.jwt() ->> 'email') OR
      EXISTS (
        SELECT 1 FROM public.posts
        JOIN public.communities ON public.communities.id = public.posts.community_id
        WHERE public.posts.id = public.comments.post_id
          AND (
            public.posts.author_email = (auth.jwt() ->> 'email') OR
            public.communities.creator_email = (auth.jwt() ->> 'email')
          )
      )
    )
  );

CREATE POLICY "author, post author, or creator can delete comments" ON public.comments
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      author_email = (auth.jwt() ->> 'email') OR
      EXISTS (
        SELECT 1 FROM public.posts
        JOIN public.communities ON public.communities.id = public.posts.community_id
        WHERE public.posts.id = public.comments.post_id
          AND (
            public.posts.author_email = (auth.jwt() ->> 'email') OR
            public.communities.creator_email = (auth.jwt() ->> 'email')
          )
      )
    )
  );

-- ── Reactions ────────────────────────────────────────────────────────────────
CREATE POLICY "anyone authenticated can read reactions" ON public.reactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users can insert own reactions" ON public.reactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "users can delete own reactions" ON public.reactions
  FOR DELETE USING (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

-- ── Courses ──────────────────────────────────────────────────────────────────
CREATE POLICY "select courses" ON public.courses
  FOR SELECT USING (auth.role() = 'authenticated' AND (published = true OR creator_email = (auth.jwt() ->> 'email')));

CREATE POLICY "creator can insert courses" ON public.courses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND creator_email = (auth.jwt() ->> 'email'));

CREATE POLICY "creator can update courses" ON public.courses
  FOR UPDATE USING (auth.role() = 'authenticated' AND creator_email = (auth.jwt() ->> 'email'));

CREATE POLICY "creator can delete courses" ON public.courses
  FOR DELETE USING (auth.role() = 'authenticated' AND creator_email = (auth.jwt() ->> 'email'));

-- ── Modules ──────────────────────────────────────────────────────────────────
CREATE POLICY "select modules" ON public.modules
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.courses WHERE public.courses.id = public.modules.course_id));

CREATE POLICY "creator can manage modules" ON public.modules
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.courses WHERE public.courses.id = public.modules.course_id AND public.courses.creator_email = (auth.jwt() ->> 'email')));

-- ── Lessons ──────────────────────────────────────────────────────────────────
CREATE POLICY "select lessons" ON public.lessons
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM public.courses
        WHERE public.courses.id = public.lessons.course_id
          AND public.courses.creator_email = (auth.jwt() ->> 'email')
      ) OR
      EXISTS (
        SELECT 1 FROM public.course_access
        WHERE public.course_access.course_id = public.lessons.course_id
          AND public.course_access.user_email = (auth.jwt() ->> 'email')
      ) OR
      EXISTS (
        SELECT 1 FROM public.courses
        JOIN public.communities ON public.communities.id = public.courses.community_id
        LEFT JOIN public.community_access ON public.community_access.community_id = public.communities.id AND public.community_access.user_email = (auth.jwt() ->> 'email')
        WHERE public.courses.id = public.lessons.course_id
          AND (public.communities.tag = 'FREE' OR public.community_access.id IS NOT NULL)
      )
    )
  );

CREATE POLICY "creator can manage lessons" ON public.lessons
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.courses WHERE public.courses.id = public.lessons.course_id AND public.courses.creator_email = (auth.jwt() ->> 'email')));

-- ── Lesson Resources ──────────────────────────────────────────────────────────
CREATE POLICY "select lesson resources" ON public.lesson_resources
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.lessons WHERE public.lessons.id = public.lesson_resources.lesson_id));

CREATE POLICY "creator can manage lesson resources" ON public.lesson_resources
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.lessons JOIN public.courses ON public.courses.id = public.lessons.course_id WHERE public.lessons.id = public.lesson_resources.lesson_id AND public.courses.creator_email = (auth.jwt() ->> 'email')));

-- ── Community Resources ───────────────────────────────────────────────────────
CREATE POLICY "select community resources" ON public.community_resources
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM public.communities
        WHERE public.communities.id = public.community_resources.community_id
          AND public.communities.creator_email = (auth.jwt() ->> 'email')
      ) OR
      EXISTS (
        SELECT 1 FROM public.communities
        LEFT JOIN public.community_access ON public.community_access.community_id = public.communities.id AND public.community_access.user_email = (auth.jwt() ->> 'email')
        WHERE public.communities.id = public.community_resources.community_id
          AND (public.communities.tag = 'FREE' OR public.community_access.id IS NOT NULL)
      )
    )
  );

CREATE POLICY "creator can manage community resources" ON public.community_resources
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.communities WHERE public.communities.id = public.community_resources.community_id AND public.communities.creator_email = (auth.jwt() ->> 'email')));

-- ── Community Events ─────────────────────────────────────────────────────────
CREATE POLICY "select community events" ON public.community_events
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM public.communities
        WHERE public.communities.id = public.community_events.community_id
          AND public.communities.creator_email = (auth.jwt() ->> 'email')
      ) OR
      EXISTS (
        SELECT 1 FROM public.communities
        LEFT JOIN public.community_access ON public.community_access.community_id = public.communities.id AND public.community_access.user_email = (auth.jwt() ->> 'email')
        WHERE public.communities.id = public.community_events.community_id
          AND (public.communities.tag = 'FREE' OR public.community_access.id IS NOT NULL)
      )
    )
  );

CREATE POLICY "creator can manage community events" ON public.community_events
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.communities WHERE public.communities.id = public.community_events.community_id AND public.communities.creator_email = (auth.jwt() ->> 'email')));

-- ── Enrollments ──────────────────────────────────────────────────────────────
CREATE POLICY "select enrollments" ON public.enrollments
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      user_email = (auth.jwt() ->> 'email') OR
      EXISTS (
        SELECT 1 FROM public.courses
        WHERE public.courses.id = public.enrollments.course_id
          AND public.courses.creator_email = (auth.jwt() ->> 'email')
      )
    )
  );

CREATE POLICY "users can manage their own enrollments" ON public.enrollments
  FOR ALL USING (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

-- ── Access Records ───────────────────────────────────────────────────────────
CREATE POLICY "users can select own access records" ON public.access_records
  FOR SELECT USING (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "users can manage own access records" ON public.access_records
  FOR ALL USING (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

-- ── Notifications ────────────────────────────────────────────────────────────
CREATE POLICY "users can select own notifications" ON public.notifications
  FOR SELECT USING (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'authenticated' AND user_email = (auth.jwt() ->> 'email'));

-- ── Payments (legacy table) ──────────────────────────────────────────────────
CREATE POLICY "select legacy payments" ON public.payments
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      from_email = (auth.jwt() ->> 'email') OR
      to_email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "insert legacy payments" ON public.payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND from_email = (auth.jwt() ->> 'email'));
