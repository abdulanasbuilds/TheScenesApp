-- Skool/Circle parity additions for public.communities
-- Safe to run multiple times.

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS icon_url            text,
  ADD COLUMN IF NOT EXISTS discovery_keywords  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS screening_questions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS welcome_message     text,
  ADD COLUMN IF NOT EXISTS affiliate_settings  jsonb NOT NULL DEFAULT '{"enabled": false, "commissionRate": 20, "commissionType": "recurring", "cookieDays": 30, "referralCode": ""}'::jsonb,
  ADD COLUMN IF NOT EXISTS gamification_levels jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Cap array sizes at the app layer, but add a defensive DB check too.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communities_keywords_max_11'
  ) THEN
    ALTER TABLE public.communities
      ADD CONSTRAINT communities_keywords_max_11
      CHECK (array_length(discovery_keywords, 1) IS NULL OR array_length(discovery_keywords, 1) <= 11);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communities_screening_max_3'
  ) THEN
    ALTER TABLE public.communities
      ADD CONSTRAINT communities_screening_max_3
      CHECK (array_length(screening_questions, 1) IS NULL OR array_length(screening_questions, 1) <= 3);
  END IF;
END $$;

-- GIN index so Discover keyword search stays fast at scale.
CREATE INDEX IF NOT EXISTS communities_discovery_keywords_gin
  ON public.communities USING GIN (discovery_keywords);
