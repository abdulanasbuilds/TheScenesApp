# SukaSpace — Cloudflare Deployment Setup

Complete guide to go from zero to a working production deployment on Cloudflare.

---

## 1. Prerequisites

```bash
# Install Wrangler CLI globally (if not already)
bun add -g wrangler

# Authenticate with Cloudflare
bunx wrangler login
```

---

## 2. Set up Supabase (database + auth)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**
3. Paste the entire contents of `src/supabase/schema.sql` and click **Run**
   - This creates all 19 tables, indexes, RLS policies, and Realtime setup
   - It's idempotent — safe to run again after changes
4. Go to **Project Settings → API** and copy:
   - **Project URL** → used for `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public key** → used for `VITE_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`
   - **service_role key** → used for `SUPABASE_SERVICE_KEY` (keep this secret!)

---

## 3. Set up Paystack (payments)

1. Create an account at [paystack.com](https://paystack.com)
2. Go to **Settings → API Keys & Webhooks**
3. Copy:
   - **Public Key** (`pk_live_...`) → `VITE_PAYSTACK_PUBLIC_KEY`
   - **Secret Key** (`sk_live_...`) → `PAYSTACK_SECRET_KEY`

---

## 4. Set up Resend (transactional emails)

1. Create an account at [resend.com](https://resend.com)
2. Go to **Domains** → add and verify your domain
3. Go to **API Keys** → create a key → `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to a verified sender on that domain (e.g. `hello@yourdomain.com`)

---

## 5. Set up Telegram notifications (optional — for feedback alerts)

Skip this if you don't want Telegram alerts. Feedback still saves to Supabase without it.

1. Message [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → copy the token → `TELEGRAM_BOT_TOKEN`
2. Add your bot to a private group or channel
3. Message [@userinfobot](https://t.me/userinfobot) in that chat → copy the chat ID → `TELEGRAM_PRIVATE_CHAT_ID`
   (Group/channel IDs are negative numbers, e.g. `-1001234567890`)

---

## 6. Configure environment variables in Cloudflare

There are **two types of vars** — both must be set.

### A) Build-time variables (set in Cloudflare Pages / Workers build config)

These are public values baked into the client JS bundle by Vite at build time.

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack → Settings → API Keys → Public Key |
| `VITE_APP_URL` | Your production domain, e.g. `https://sukaspace.com` |

**In Cloudflare dashboard:** Workers & Pages → Your project → Settings → Environment Variables → Add as plain variables.

### B) Runtime secrets (server-only, never in client bundle)

These are read by Cloudflare Worker server functions at runtime.

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Same value as `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Same value as `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → service_role key |
| `PAYSTACK_SECRET_KEY` | Paystack → Settings → API Keys → Secret Key |
| `RESEND_API_KEY` | Resend → API Keys |
| `RESEND_FROM_EMAIL` | e.g. `hello@yourdomain.com` |
| `APP_URL` | Same value as `VITE_APP_URL` |
| `TELEGRAM_BOT_TOKEN` | Optional — from @BotFather |
| `TELEGRAM_PRIVATE_CHAT_ID` | Optional — negative group ID |

**Via CLI:**
```bash
bunx wrangler secret put SUPABASE_URL
bunx wrangler secret put SUPABASE_ANON_KEY
bunx wrangler secret put SUPABASE_SERVICE_KEY
bunx wrangler secret put PAYSTACK_SECRET_KEY
bunx wrangler secret put RESEND_API_KEY
bunx wrangler secret put RESEND_FROM_EMAIL
bunx wrangler secret put APP_URL
bunx wrangler secret put TELEGRAM_BOT_TOKEN         # optional
bunx wrangler secret put TELEGRAM_PRIVATE_CHAT_ID   # optional
```

**Or in Cloudflare dashboard:** Workers & Pages → Your project → Settings → Environment Variables → Add as **Encrypted** (secret).

---

## 7. Build and deploy

```bash
# Build (Vite bakes VITE_* vars from your .env into the client bundle)
bun run build

# Deploy to Cloudflare
bunx wrangler deploy
```

> **Note:** On every re-deploy after changing `VITE_*` vars, you must rebuild (`bun run build`) so Vite re-bakes the new values into the bundle. Runtime secrets (non-VITE vars) take effect immediately without a rebuild.

---

## 8. Custom domain

In Cloudflare dashboard → Workers & Pages → Your Worker → Settings → Triggers → Custom Domains → Add your domain.

---

## 9. Verify everything works

After deploying, test these flows:

- [ ] Sign up with a new email → welcome email arrives
- [ ] Create a community → visible in Discover
- [ ] Join a paid community → Paystack popup → payment confirmed email
- [ ] Submit feedback → check Supabase dashboard → `feedback` table → row appears
- [ ] Open the app on mobile → PWA install prompt appears after ~4 seconds
- [ ] Log out → `/create-community` redirects to auth

---

## Troubleshooting

**Supabase writes failing (403 / RLS errors)**
→ Make sure you ran `src/supabase/schema.sql` in Supabase SQL Editor. RLS policies won't exist without it.

**Paystack popup doesn't open**
→ Check `VITE_PAYSTACK_PUBLIC_KEY` was set before building. Rebuild after adding it.

**Emails not sending**
→ Check `RESEND_API_KEY` is set as a runtime secret. Check `RESEND_FROM_EMAIL` is from a verified Resend domain.

**Server functions returning 500**
→ Check Cloudflare Worker logs: Workers & Pages → Your Worker → Logs → tail live logs with:
```bash
bunx wrangler tail
```

**Realtime not working (no live updates)**
→ Supabase → Project Settings → API → Realtime → ensure it's enabled.
→ Run `src/supabase/schema.sql` again — it includes `ALTER PUBLICATION supabase_realtime ADD TABLE ...` for all subscribed tables.
