-- Phase 3A Wave 1 — deterministic seed.
--
-- Contract: docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md §4.
--
-- Every catalogue actor is fictional, uses a reserved `.invalid` address, has no password, no
-- identity row, no session, and no confirmation flow. Profiles are created only through the
-- hardened `private.handle_auth_user_created()` trigger on `auth.users`, using the same
-- `raw_user_meta_data` contract a real signup uses.
--
-- No learner account is seeded. Browser learners are created through the real signup flow.
--
-- All UUIDs, slugs, positions, and timestamps are fixed so two clean resets produce the same
-- semantic fingerprint. This file is idempotent (`on conflict do nothing`) so a re-run cannot
-- duplicate catalogue rows.

begin;

-- ---------------------------------------------------------------------------
-- 1. Catalogue actors (Auth rows -> profiles through the hardened trigger)
-- ---------------------------------------------------------------------------

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'nadia.okafor@catalogue.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"nadiaokafor","display_name":"Nadia Okafor"}'::jsonb,
    timestamptz '2026-01-05T09:00:00Z',
    timestamptz '2026-01-05T09:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'kwame.mensah@catalogue.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"kwamemensah","display_name":"Kwame Mensah"}'::jsonb,
    timestamptz '2026-01-05T09:00:00Z',
    timestamptz '2026-01-05T09:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'sela.adjei@catalogue.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"selaadjei","display_name":"Sela Adjei"}'::jsonb,
    timestamptz '2026-01-05T09:00:00Z',
    timestamptz '2026-01-05T09:00:00Z'
  )
on conflict (id) do nothing;

-- The trigger creates the profile row; catalogue-only profile fields are completed here so the
-- seed stays deterministic across resets (insert defaults would otherwise be `now()`). The
-- `touch_updated_at` trigger is disabled for this administrative backfill so the fixed timestamps
-- survive; it is re-enabled before the transaction commits.
alter table public.profiles disable trigger profiles_touch_updated_at;

update public.profiles
set
  headline = 'Product designer and design educator',
  bio = 'I help early-career designers turn messy discovery into clear, shippable product decisions.',
  location = 'Accra, Ghana',
  created_at = timestamptz '2026-01-05T09:00:00Z',
  updated_at = timestamptz '2026-01-05T09:00:00Z'
where id = '10000000-0000-4000-8000-000000000001';

update public.profiles
set
  headline = 'AI product engineer and technical writer',
  bio = 'I build and teach practical AI features with a bias for evaluation, guardrails, and honest limits.',
  location = 'Nairobi, Kenya',
  created_at = timestamptz '2026-01-05T09:00:00Z',
  updated_at = timestamptz '2026-01-05T09:00:00Z'
where id = '10000000-0000-4000-8000-000000000002';

update public.profiles
set
  headline = 'Platform curator',
  bio = 'Fictional platform curator used only for deterministic catalogue ownership in the local proof.',
  location = 'Accra, Ghana',
  created_at = timestamptz '2026-01-05T09:00:00Z',
  updated_at = timestamptz '2026-01-05T09:00:00Z'
where id = '10000000-0000-4000-8000-000000000003';

alter table public.profiles enable trigger profiles_touch_updated_at;

-- ---------------------------------------------------------------------------
-- 2. Workspaces and memberships
-- ---------------------------------------------------------------------------

insert into public.workspaces (id, kind, name, slug, status, created_by, created_at, updated_at)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'creator',
    'Product Design Studio',
    'product-design-studio',
    'active',
    '10000000-0000-4000-8000-000000000001',
    timestamptz '2026-01-05T09:05:00Z',
    timestamptz '2026-01-05T09:05:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'creator',
    'AI Builders Guild',
    'ai-builders-guild',
    'active',
    '10000000-0000-4000-8000-000000000002',
    timestamptz '2026-01-05T09:05:00Z',
    timestamptz '2026-01-05T09:05:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'platform',
    'The Scenes Platform',
    'the-scenes-platform',
    'active',
    '10000000-0000-4000-8000-000000000003',
    timestamptz '2026-01-05T09:05:00Z',
    timestamptz '2026-01-05T09:05:00Z'
  )
on conflict (id) do nothing;

insert into public.workspace_memberships (
  id,
  workspace_id,
  user_id,
  role,
  status,
  created_at,
  updated_at
)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'owner',
    'active',
    timestamptz '2026-01-05T09:06:00Z',
    timestamptz '2026-01-05T09:06:00Z'
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'owner',
    'active',
    timestamptz '2026-01-05T09:06:00Z',
    timestamptz '2026-01-05T09:06:00Z'
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'owner',
    'active',
    timestamptz '2026-01-05T09:06:00Z',
    timestamptz '2026-01-05T09:06:00Z'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Categories
-- ---------------------------------------------------------------------------

insert into public.categories (id, slug, name, blurb, accent_hue, sort_order, status, created_at, updated_at)
values
  (
    '30000000-0000-4000-8000-000000000001',
    'ai',
    'AI',
    'Practical AI skills, evaluation, and responsible product building.',
    265,
    1,
    'active',
    timestamptz '2026-01-05T09:10:00Z',
    timestamptz '2026-01-05T09:10:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'design',
    'Design',
    'Product, interface, and visual design craft for real users.',
    320,
    2,
    'active',
    timestamptz '2026-01-05T09:10:00Z',
    timestamptz '2026-01-05T09:10:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'web-product',
    'Web + Product',
    'Build, ship, and improve modern web products.',
    210,
    3,
    'active',
    timestamptz '2026-01-05T09:10:00Z',
    timestamptz '2026-01-05T09:10:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    'business-freelancing',
    'Business + Freelancing',
    'Turn expertise into sustainable independent work.',
    150,
    4,
    'active',
    timestamptz '2026-01-05T09:10:00Z',
    timestamptz '2026-01-05T09:10:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    'content',
    'Content',
    'Write, record, and publish work people actually use.',
    25,
    5,
    'active',
    timestamptz '2026-01-05T09:10:00Z',
    timestamptz '2026-01-05T09:10:00Z'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Communities and category links
-- ---------------------------------------------------------------------------

insert into public.communities (
  id,
  workspace_id,
  slug,
  name,
  tagline,
  description,
  privacy,
  join_policy,
  discoverability,
  status,
  accent_hue,
  languages,
  published_at,
  created_at,
  updated_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'product-design-studio',
    'Product Design Studio',
    'Learn product design by shipping decisions, not decoration.',
    'A public, open community for early-career designers. The seeded happy path lets any signed-in learner join, enrol, and complete lessons.',
    'public',
    'open',
    'listed',
    'published',
    320,
    array['en'],
    timestamptz '2026-01-06T10:00:00Z',
    timestamptz '2026-01-06T09:00:00Z',
    timestamptz '2026-01-06T10:00:00Z'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'ai-builders-guild',
    'AI Builders Guild',
    'Ship AI features with evaluation and guardrails, not guesswork.',
    'A private, invite-only community. Its metadata is listed, but joining requires an invitation, so direct join attempts are concealed and denied.',
    'private',
    'invite',
    'listed',
    'published',
    265,
    array['en'],
    timestamptz '2026-01-06T10:00:00Z',
    timestamptz '2026-01-06T09:00:00Z',
    timestamptz '2026-01-06T10:00:00Z'
  )
on conflict (id) do nothing;

insert into public.community_categories (community_id, category_id, is_primary)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',
    false
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    true
  )
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 5. Courses
-- ---------------------------------------------------------------------------

insert into public.courses (
  id,
  workspace_id,
  community_id,
  category_id,
  instructor_id,
  slug,
  title,
  subtitle,
  description,
  level,
  access,
  status,
  published_at,
  created_at,
  updated_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'product-design-foundations',
    'Product Design Foundations',
    'A practical first pass through discovery, journeys, and prototypes.',
    'A four-lesson introduction to the decisions behind useful product design. Learners practise framing problems, mapping journeys, and turning insight into a testable interface.',
    'beginner',
    'included',
    'published',
    timestamptz '2026-01-07T10:00:00Z',
    timestamptz '2026-01-07T09:00:00Z',
    timestamptz '2026-01-07T10:00:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'ship-ai-features',
    'Ship AI Features with Confidence',
    'Evaluation, guardrails, and honest limits for real AI products.',
    'A short, practical course on choosing AI tasks, evaluating output, and shipping guardrails that keep a feature useful and safe.',
    'intermediate',
    'included',
    'published',
    timestamptz '2026-01-07T10:00:00Z',
    timestamptz '2026-01-07T09:00:00Z',
    timestamptz '2026-01-07T10:00:00Z'
  )
on conflict (id) do nothing;

insert into public.course_outcomes (id, course_id, position, body)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    1,
    'Frame a product problem from evidence rather than assumption.'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000001',
    2,
    'Map a user journey and identify the highest-leverage moment.'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000001',
    3,
    'Turn an insight into a small, testable prototype.'
  ),
  (
    '60000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000002',
    1,
    'Choose AI tasks where model output can be checked.'
  ),
  (
    '60000000-0000-4000-8000-000000000005',
    '50000000-0000-4000-8000-000000000002',
    2,
    'Design a lightweight evaluation set before shipping.'
  ),
  (
    '60000000-0000-4000-8000-000000000006',
    '50000000-0000-4000-8000-000000000002',
    3,
    'Add guardrails that fail safely and stay observable.'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Modules, lessons, contents, and resources
-- ---------------------------------------------------------------------------

insert into public.course_modules (id, course_id, title, position)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'Design Foundations',
    1
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000001',
    'From Insight to Interface',
    2
  ),
  (
    '70000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000002',
    'AI Product Basics',
    1
  ),
  (
    '70000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000002',
    'Shipping Safely',
    2
  )
on conflict (id) do nothing;

insert into public.lessons (
  id,
  course_id,
  module_id,
  slug,
  title,
  summary,
  kind,
  duration_minutes,
  is_preview,
  position,
  created_at,
  updated_at
)
values
  (
    '80000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    'why-product-design',
    'Why Product Design',
    'What product design actually decides, and why the job is bigger than screens.',
    'reading',
    8,
    true,
    1,
    timestamptz '2026-01-07T09:10:00Z',
    timestamptz '2026-01-07T09:10:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    'the-discovery-mindset',
    'The Discovery Mindset',
    'How to separate what people say from what the evidence can support.',
    'video',
    12,
    false,
    2,
    timestamptz '2026-01-07T09:10:00Z',
    timestamptz '2026-01-07T09:10:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000002',
    'mapping-user-journeys',
    'Mapping User Journeys',
    'A lightweight journey map that exposes the moment worth designing for.',
    'exercise',
    20,
    false,
    1,
    timestamptz '2026-01-07T09:10:00Z',
    timestamptz '2026-01-07T09:10:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000002',
    'prototyping-in-figma',
    'Prototyping in Figma',
    'Build the smallest prototype that can answer the question.',
    'video',
    25,
    false,
    2,
    timestamptz '2026-01-07T09:10:00Z',
    timestamptz '2026-01-07T09:10:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000005',
    '50000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000003',
    'what-llms-are-good-at',
    'What LLMs Are Good At',
    'Match the task to the model instead of forcing the model onto the task.',
    'reading',
    10,
    true,
    1,
    timestamptz '2026-01-07T09:10:00Z',
    timestamptz '2026-01-07T09:10:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000006',
    '50000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000003',
    'evaluating-model-output',
    'Evaluating Model Output',
    'A small evaluation set beats a confident demo.',
    'reading',
    15,
    false,
    2,
    timestamptz '2026-01-07T09:10:00Z',
    timestamptz '2026-01-07T09:10:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000007',
    '50000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000004',
    'guardrails-and-evals',
    'Guardrails and Evals',
    'Make failure visible, bounded, and recoverable.',
    'video',
    22,
    false,
    1,
    timestamptz '2026-01-07T09:10:00Z',
    timestamptz '2026-01-07T09:10:00Z'
  )
on conflict (id) do nothing;

insert into public.lesson_contents (lesson_id, body_version, body, created_at, updated_at)
values
  (
    '80000000-0000-4000-8000-000000000001',
    1,
    '[
      {"type":"paragraph","text":"Product design is the work of deciding what a product should do and how it should behave before and while it is built."},
      {"type":"heading","level":2,"text":"Decisions, not decoration"},
      {"type":"callout","tone":"tip","text":"If a screen does not change a decision, it is probably decoration."}
    ]'::jsonb,
    timestamptz '2026-01-07T09:15:00Z',
    timestamptz '2026-01-07T09:15:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    1,
    '[
      {"type":"paragraph","text":"Discovery is not a phase you finish. It is a habit of checking the story against the evidence."},
      {"type":"callout","tone":"warning","text":"A confident stakeholder is not the same thing as a validated assumption."}
    ]'::jsonb,
    timestamptz '2026-01-07T09:15:00Z',
    timestamptz '2026-01-07T09:15:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000003',
    1,
    '[
      {"type":"paragraph","text":"Map the journey at the level of decisions: what the person knows, chooses, and risks at each step."},
      {"type":"heading","level":3,"text":"Find the leverage"},
      {"type":"paragraph","text":"The best moment to design for is usually where uncertainty and consequence meet."}
    ]'::jsonb,
    timestamptz '2026-01-07T09:15:00Z',
    timestamptz '2026-01-07T09:15:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000004',
    1,
    '[
      {"type":"paragraph","text":"A prototype is a question with a shape. Keep it small enough to throw away."},
      {"type":"callout","tone":"info","text":"Simulated video in the local proof is always labelled as simulated."}
    ]'::jsonb,
    timestamptz '2026-01-07T09:15:00Z',
    timestamptz '2026-01-07T09:15:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000005',
    1,
    '[
      {"type":"paragraph","text":"Large language models are strongest where output can be checked and where a plausible draft saves real effort."},
      {"type":"heading","level":2,"text":"Choose checkable tasks"},
      {"type":"callout","tone":"tip","text":"If you cannot describe how you would verify the output, do not ship the feature yet."}
    ]'::jsonb,
    timestamptz '2026-01-07T09:15:00Z',
    timestamptz '2026-01-07T09:15:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000006',
    1,
    '[
      {"type":"paragraph","text":"Write down a small set of representative inputs and the properties a good answer must have."},
      {"type":"callout","tone":"warning","text":"A demo that works once is not evidence that the feature works."}
    ]'::jsonb,
    timestamptz '2026-01-07T09:15:00Z',
    timestamptz '2026-01-07T09:15:00Z'
  ),
  (
    '80000000-0000-4000-8000-000000000007',
    1,
    '[
      {"type":"paragraph","text":"Guardrails turn an unpredictable model into a product with bounded failure."},
      {"type":"heading","level":3,"text":"Fail visibly"},
      {"type":"paragraph","text":"Log the refusal, keep the user in control, and make recovery obvious."}
    ]'::jsonb,
    timestamptz '2026-01-07T09:15:00Z',
    timestamptz '2026-01-07T09:15:00Z'
  )
on conflict (lesson_id) do nothing;

insert into public.lesson_resources (
  id,
  lesson_id,
  label,
  kind,
  url,
  position,
  created_at,
  updated_at
)
values
  (
    '90000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000001',
    'Decision journal template',
    'sheet',
    'https://resources.thescenes.example/decision-journal',
    1,
    timestamptz '2026-01-07T09:20:00Z',
    timestamptz '2026-01-07T09:20:00Z'
  ),
  (
    '90000000-0000-4000-8000-000000000002',
    '80000000-0000-4000-8000-000000000003',
    'Journey map worksheet',
    'pdf',
    'https://resources.thescenes.example/journey-map.pdf',
    1,
    timestamptz '2026-01-07T09:20:00Z',
    timestamptz '2026-01-07T09:20:00Z'
  ),
  (
    '90000000-0000-4000-8000-000000000003',
    '80000000-0000-4000-8000-000000000005',
    'Task-fit checklist',
    'link',
    'https://resources.thescenes.example/task-fit-checklist',
    1,
    timestamptz '2026-01-07T09:20:00Z',
    timestamptz '2026-01-07T09:20:00Z'
  ),
  (
    '90000000-0000-4000-8000-000000000004',
    '80000000-0000-4000-8000-000000000007',
    'Guardrail review template',
    'sheet',
    'https://resources.thescenes.example/guardrail-review',
    1,
    timestamptz '2026-01-07T09:20:00Z',
    timestamptz '2026-01-07T09:20:00Z'
  )
on conflict (id) do nothing;

commit;
