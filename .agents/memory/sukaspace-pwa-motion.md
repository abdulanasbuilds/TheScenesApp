---
name: SukaSpace PWA + Motion
description: PWA manifest/SW setup, Framer Motion spring presets, haptics, vaul drawer, skeleton components.
---

## PWA Setup
- public/manifest.json: display standalone, orientation portrait-primary, theme_color #1D4ED8
- public/sw.js: cache-first for images/static assets, network-first for navigation (SSR-safe)
- SW registered in __root.tsx via registerServiceWorker() (src/lib/pwa.ts) on client mount
- iOS meta tags in __root.tsx head: apple-mobile-web-app-capable, apple-mobile-web-app-title, theme-color
- overscroll-behavior-y: none on body in styles.css (prevents pull-to-refresh)

## Spring Presets (src/lib/pwa.ts)
- SPRING_FAST: stiffness 300 / damping 28 / mass 0.8 — buttons, checkboxes, rapid taps
- SPRING_STRUCTURAL: stiffness 220 / damping 24 — slide-overs, drawers, sheets
- SPRING_PAGE: stiffness 200 / damping 26 — page-level entry transitions

## Haptics (src/lib/pwa.ts)
- hapticTap(): navigator.vibrate(10) — standard taps
- hapticMilestone(): navigator.vibrate([15, 30, 15]) — milestone unlocks
- hapticError(): navigator.vibrate([10, 20, 10, 20, 10]) — validation errors
- All wrapped in try/catch with typeof guard — safe in all environments

## Vaul Drawer (AppShell)
- NotificationsDrawer: vaul bottom sheet on mobile (<768px), AnimatePresence popover on desktop
- isMobile state derived from window.innerWidth with resize listener

## Skeleton Components (src/components/PageSkeleton.tsx)
- PostCardSkeleton, FeedSkeleton, DashboardSkeleton, CourseListSkeleton, MembersSkeleton
- AppLoadingSkeleton: replaces bare spinner during AppShell hydration
- Shimmer keyframe injected once into document.head on client

**Why:** No linear CSS transitions anywhere — all motion is physics-based. Haptics enhance mobile native feel.
