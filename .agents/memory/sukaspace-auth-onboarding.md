---
name: SukaSpace Auth Instant Provisioning
description: Signup skips /onboarding and routes directly to feed; background prefetch on valid email.
---

## Instant Provisioning

- After signup, routed directly to /app/creator (creator) or /app/dashboard (learner) — no /onboarding step
- /onboarding route still exists and is accessible manually (e.g. from Settings in future)
- Profile picture / bio set later from Settings tab

## Background Prefetch Hook

- useBackgroundPrefetch(email) fires once when email contains "@" and length >= 5
- Pre-warms top static images via new Image() to prime browser cache
- Gated by useRef so it only fires once per mount

## Haptics in Auth

- hapticTap() on successful form submit attempt
- hapticError() on all validation failures (bad email, short password, missing name, email taken, wrong password)
- hapticTap() on mode toggle (signup ↔ signin) and forgot-password back button

## Motion

- forgotMode view and main Auth view both wrapped in motion.div with SPRING_PAGE entry (opacity + y)
- Submit button uses SPRING_FAST whileTap scale

**Why:** First-10-second UX goal — user reaches the feed without multi-step surveys.
