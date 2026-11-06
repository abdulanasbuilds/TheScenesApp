-- Phase 3A Wave 1 — 0017: private transition audit.
--
-- Contract: §3.16. No client schema/table privilege; command functions insert one event only when
-- they win a real state transition.

create table private.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  request_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_action_values
    check (action in ('community.joined', 'community.left', 'course.enrolled', 'lesson.completed')),
  constraint audit_events_target_type_values
    check (target_type in ('community', 'course', 'lesson')),
  constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint audit_events_metadata_size check (pg_column_size(metadata) <= 4096)
);

create index audit_events_actor_idx on private.audit_events (actor_id, created_at desc);
create index audit_events_target_idx on private.audit_events (target_type, target_id, created_at desc);

alter table private.audit_events enable row level security;

-- No grants to anon/authenticated/service_role: private is not exposed and no client role is given
-- any privilege on this table.
revoke all on table private.audit_events from anon, authenticated, service_role;
