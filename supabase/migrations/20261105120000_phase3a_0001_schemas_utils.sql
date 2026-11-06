-- Phase 3A Wave 1 — 0001: schemas, shared utilities, and baseline grants.
--
-- Contract: docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md §2 (global conventions).
-- `private` holds non-API helpers, the audit store, and trigger functions. It is not exposed
-- through the Data API (see supabase/config.toml `api.schemas`).

create schema if not exists private;

comment on schema private is
  'Non-API helpers, audit storage, and trigger functions for The Scenes Phase 3A.';

grant usage on schema private to authenticated;

-- Baseline default privileges. Supabase images may pre-seed a permissive `postgres` default ACL
-- in `public`; remove it so a future object can never become client-reachable without an explicit,
-- reviewed grant. Revokes are no-ops when the default privilege was never granted.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema private
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema private
  revoke all on functions from public, anon, authenticated, service_role;

-- gen_random_uuid() is built-in on PostgreSQL 13+; no extension is required on Postgres 17.

-- Shared updated_at trigger. Attached per table that carries `updated_at`.
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_updated_at() from public;
