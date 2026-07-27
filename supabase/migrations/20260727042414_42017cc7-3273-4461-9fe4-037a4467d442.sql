CREATE TABLE IF NOT EXISTS public.payout_accounts (
  creator_email        text PRIMARY KEY,
  method               text NOT NULL DEFAULT 'bank' CHECK (method IN ('bank','mobile_money')),
  provider             text NOT NULL DEFAULT 'paystack',
  country              text NOT NULL DEFAULT 'NG',
  currency             text NOT NULL DEFAULT 'NGN',
  bank_code            text,
  bank_name            text,
  account_number       text,
  account_name         text,
  mobile_money_network text,
  mobile_money_number  text,
  recipient_code       text,
  verification_status  text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','failed')),
  is_payout_ready      boolean NOT NULL DEFAULT false,
  default_withdrawal_type text NOT NULL DEFAULT 'standard' CHECK (default_withdrawal_type IN ('standard','instant')),
  payout_notifications boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payout_accounts TO authenticated;
GRANT ALL ON public.payout_accounts TO service_role;

ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payout_accounts_read_own" ON public.payout_accounts
  FOR SELECT TO authenticated
  USING (creator_email = auth.email());

DROP TRIGGER IF EXISTS trg_payout_accounts_touch ON public.payout_accounts;
CREATE TRIGGER trg_payout_accounts_touch
  BEFORE UPDATE ON public.payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();