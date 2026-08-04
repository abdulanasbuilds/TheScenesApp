# SukaSpace — Supabase Activity Resilience & Recovery Guide

To prevent the Supabase PostgreSQL database from being paused due to inactivity (common on Supabase Free Plan tiers during low-traffic periods), SukaSpace features a built-in **Activity Resilience & Recovery Layer**. This layer ensures the application remains highly reliable while gracefully recovering if a platform-enforced pause still occurs.

---

## 1. How the Resilience Layer Works

The system is designed with a **low-cost, non-deceptive operational design**:

1. **Self-Monitoring Traffic (Organic Detection):**
   - The app actively monitors client-side database requests. When real users interact with the app, a local timestamp `ss_last_organic_traffic` is refreshed.
   - If organic traffic has occurred within the configured window (default: `24 hours`), the keep-alive system **disables itself completely** to avoid redundant queries and keep database load at absolute zero.

2. **Legitimate Keep-Alive Heartbeat:**
   - If the app is completely idle for >24 hours, the scheduled heartbeat triggers.
   - The heartbeat runs a trivial, read-only query (such as checking active rows in the static table `subscription_plans`).
   - This represents **real operational status verification** and produces legitimate, non-spammy activity.

3. **API & Cron Integration:**
   - A dedicated GET endpoint exists at `/api/heartbeat` which returns a full diagnostic report.
   - You can easily register this endpoint in any external uptime monitor (such as [UptimeRobot](https://uptimerobot.com) or [Cron-Job.org](https://cron-job.org)) to ping `/api/heartbeat` at regular intervals (e.g. once every 12 hours) to automate background keep-alives.

4. **Instant Feature Flags:**
   - The entire system can be instantly turned off by setting `RESILIENCE_CONFIG.ENABLED = false` in `src/lib/activity-resilience.ts`, or will automatically disable when upgrading your Supabase project to a Paid Plan tier.

---

## 2. Self-Healing Pause Recovery (User Experience)

If Supabase still pauses the project, SukaSpace will not crash or show a broken/empty dashboard. Instead:

1. **Pause Detection Interceptor:**
   - The database wrapper and state provider intercept connection errors (e.g., DNS resolution failure `ENOTFOUND` or connection refused `ECONNREFUSED` which happen when Supabase turns off the database container).
2. **Polished Reconnecting Screen:**
   - Users are shown a gorgeous, animated **"Database Reconnecting" fallback screen**.
   - The fallback page explains the state clearly and friendly, so users do not feel the app is broken.
3. **Automated Background Restoration Pings:**
   - The fallback screen runs a lightweight check in the background every 5 seconds.
   - As soon as the database wakes up, the fallback screen automatically refreshes the page and restores the session instantly.

---

## 3. Administrator Manual Recovery Checklist

If your Supabase project has been paused for several weeks, it may require manual restoration from the platform:

- [ ] **Step 1:** Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
- [ ] **Step 2:** Select your project reference ID: `qoialgwtskcthscfcgzj`.
- [ ] **Step 3:** Click the green **"Restore Project"** button on the project home page.
- [ ] **Step 4:** Wait 1–2 minutes for the database containers to provision and DNS records to re-propagate.
- [ ] **Step 5:** Navigate back to SukaSpace. The app will automatically connect and resume regular operations.

---

## 4. Configuration Reference

All settings can be customized in `src/lib/activity-resilience.ts`:

- **`ENABLED`**: Set to `true`/`false` to toggle the system.
- **`HEARTBEAT_INTERVAL_MS`**: Time between heartbeats when idle (default: `12 hours`).
- **`IDLE_WINDOW_MS`**: Inactivity period required before triggering keep-alives (default: `24 hours`).
- **`QUERY_TIMEOUT_MS`**: Timeout threshold for database queries before flagging as potentially paused (default: `8 seconds`).
