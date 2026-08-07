# SukaSpace — Production Database Migrations Guide

This guide describes how to apply database migrations to your Supabase project (id: `qoialgwtskcthscfcgzj`) to get SukaSpace running perfectly.

The repository contains two ways of managing migrations:
1. **Manual Pasting (Recommended for quick Setup via Supabase Web Dashboard)**
2. **Supabase CLI (Recommended for automated deployment / local dev / reduction of workload)**

---

## Option 1: Manual Pasting (via Supabase Web Dashboard)

If you prefer to copy and paste SQL scripts manually:

1. Go to your **Supabase Dashboard** (https://supabase.com).
2. Navigate to **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Open the consolidated SQL script in this project: [**`supabase/combined_production_schema.sql`**](./combined_production_schema.sql).
5. Copy the entire contents of `supabase/combined_production_schema.sql`.
6. Paste the contents into the Supabase SQL Editor and click **Run**.

This consolidated file merges all chronological migration steps into a single idempotent script, creating:
- All core tables (`profiles`, `communities`, `joined_communities`, etc.)
- Trigger to auto-create user profiles upon signup
- Add-on payout and monetization modules (including subscriptions, payment transaction logging, wallet aggregates)
- Skool/Circle-parity custom community configurations
- Ultra-strict production **Row Level Security (RLS)** policies that protect against data spoofing, tenant leaks, and BOLA.

---

## Option 2: Automated Deployment via Supabase CLI

To automate and significantly reduce your workload, you can let the Supabase CLI manage and apply migrations for you.

### 1. Install Supabase CLI
If not already installed, install the CLI locally on your system:
```bash
# macOS/Linux (via Homebrew)
brew install supabase/tap/supabase

# npm
npm install supabase --save-dev
```

### 2. Login & Link Your Project
Ensure you are logged into your Supabase account and link your local repository to your remote project `qoialgwtskcthscfcgzj`:
```bash
# Log in to your account
npx supabase login

# Link your remote project (it will ask for your database password)
npx supabase link --project-ref qoialgwtskcthscfcgzj
```

### 3. Push Migrations to Production
Once linked, you can apply all migrations from the local `supabase/migrations/` directory chronologically to your remote production database with a single command:
```bash
npx supabase db push
```

The CLI will automatically scan, sort, and apply the migration files located in `supabase/migrations/`:
1. `20260726160805_feee2605-fc12-424b-bac8-b1762aa871aa.sql` (Consolidated Baseline Schema)
2. `20260727042414_42017cc7-3273-4461-9fe4-037a4467d442.sql` (Payout Accounts Addition)
3. `20260801061201_c0baadb6-18a2-4c45-a2eb-ca3f1ccffd66.sql` (Community Events Enhancements)
4. `20260804000000_tighten_rls.sql` (Ultra-strict security enforcement)

---

## Verification & Status Check

To check if your remote database has all the migrations applied correctly, run:
```bash
npx supabase db status
```
All migrations should show as `Active` on the remote database.
