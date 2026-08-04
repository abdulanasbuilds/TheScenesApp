-- ─────────────────────────────────────────────────────────────────────────────
-- SukaSpace — Country-Aware Monetization Schema (additive migration)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add country to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'NG';

-- 2. Create creator monetization settings
CREATE TABLE IF NOT EXISTS public.creator_monetization_settings (
  creator_email               text PRIMARY KEY REFERENCES public.profiles(email) ON DELETE CASCADE,
  global_currency             text NOT NULL DEFAULT 'NGN',
  preferred_buyer_currency    text NOT NULL DEFAULT 'NGN',
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- 3. Create creator country-specific currency overrides
CREATE TABLE IF NOT EXISTS public.creator_currency_overrides (
  creator_email               text NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  country_code                text NOT NULL, -- e.g. 'GH', 'KE', 'ZA'
  override_currency           text NOT NULL, -- e.g. 'GHS', 'KES', 'ZAR'
  created_at                  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_email, country_code)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.creator_monetization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_currency_overrides ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "monetization_settings_read_all" ON public.creator_monetization_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "monetization_settings_write_own" ON public.creator_monetization_settings
  FOR ALL TO authenticated USING (creator_email = auth.email());

CREATE POLICY "currency_overrides_read_all" ON public.creator_currency_overrides
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "currency_overrides_write_own" ON public.creator_currency_overrides
  FOR ALL TO authenticated USING (creator_email = auth.email());

-- 6. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_monetization_settings TO authenticated;
GRANT ALL ON public.creator_monetization_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_currency_overrides TO authenticated;
GRANT ALL ON public.creator_currency_overrides TO service_role;
