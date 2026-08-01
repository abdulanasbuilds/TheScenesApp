ALTER TABLE public.community_events
  ADD COLUMN IF NOT EXISTS host_platform text NOT NULL DEFAULT 'native',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'all';

ALTER TABLE public.community_events DROP CONSTRAINT IF EXISTS community_events_host_platform_check;
ALTER TABLE public.community_events ADD CONSTRAINT community_events_host_platform_check
  CHECK (host_platform IN ('native','zoom','meet','youtube','custom'));

ALTER TABLE public.community_events DROP CONSTRAINT IF EXISTS community_events_visibility_check;
ALTER TABLE public.community_events ADD CONSTRAINT community_events_visibility_check
  CHECK (visibility IN ('all','premium'));