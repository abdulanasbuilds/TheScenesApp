# Frontend Reference Research — Evidence Record

Date: 3–4 November 2026
Researcher: build agent (direct browser inspection, not memory)
Scope: visual language reference (Starter Story) and application architecture reference (Skool).

> Method: pages were opened in real Chromium sessions and measured with
> `getComputedStyle()` / `getBoundingClientRect()`. Values below marked **measured** come
> from computed styles. Values marked **estimated** are visual judgements. A second verification
> pass on 4 November captured desktop (1440 × 900) and mobile (390 × 844) browser output under
> `docs/research-screenshots/`. No competitor assets, logos, copy or brand colours were copied
> into the implementation.

### Captured reference evidence

| Reference              | Viewport                    | Repository screenshot                                         |
| ---------------------- | --------------------------- | ------------------------------------------------------------- |
| Starter Story homepage | 1440 × 900                  | `docs/research-screenshots/starter-story-home-desktop.png`    |
| Starter Story homepage | 390 × 844                   | `docs/research-screenshots/starter-story-home-mobile.png`     |
| Starter Story data     | 1440 × 900 initial viewport | `docs/research-screenshots/starter-story-data-desktop.png`    |
| Starter Story sign in  | 1440 × 900                  | `docs/research-screenshots/starter-story-sign-in-desktop.png` |
| Skool discovery        | 1440 × 900                  | `docs/research-screenshots/skool-home-desktop.png`            |
| Skool discovery        | 390 × 844                   | `docs/research-screenshots/skool-home-mobile.png`             |
| Skool public community | 1440 × 900                  | `docs/research-screenshots/skool-community-desktop.png`       |
| Skool pricing          | 1440 × 900                  | `docs/research-screenshots/skool-pricing-desktop.png`         |

The Starter Story story-detail screenshot retry on 4 November failed with a transient DNS
resolution error; the URL had already been inspected successfully in the earlier live session.

---

## PART A — STARTER STORY (visual design reference)

Pages inspected

| URL                                                                        | What it was used for                            |
| -------------------------------------------------------------------------- | ----------------------------------------------- |
| `https://www.starterstory.com/`                                            | Marketing homepage: hero, data preview, cards   |
| `https://www.starterstory.com/data`                                        | Database/discovery layout, filters, table, sort |
| `https://www.starterstory.com/data/micro-saas-ideas`                       | Category page structure, stat summary           |
| `https://www.starterstory.com/users/sign_in`                               | Auth shell, form width, social login treatment  |
| `https://www.starterstory.com/stories/how-i-built-it-30k-month-micro-saas` | Content/detail page                             |
| `https://www.starterstory.com/pricing`                                     | Returned 404 — no pricing page exists           |

The computed-style inspection viewport was 800 × 527 CSS px (≈ tablet). The second pass added
actual 1440 × 900 and 390 × 844 screenshots, so the main desktop/mobile composition is now
verified rather than inferred only from responsive class names.

### Measured colour tokens

| Role                         | Value                          | Evidence                       |
| ---------------------------- | ------------------------------ | ------------------------------ |
| Page background              | `#F8FAFC` (slate-50)           | `body` / shell background      |
| Header / hero background     | `#4338CA` (indigo-700)         | `.hero-v2` computed background |
| Primary action / active chip | `#4F46E5` (indigo-600)         | chip + “Ask” button            |
| Card surface                 | `#FFFFFF`                      | card background                |
| Card border                  | `#E2E8F0` / `#DEE2E6` (0.67px) | card border, hairline          |
| Table row divider            | `#F1F5F9` (slate-100)          | `tr` border-bottom             |
| Heading text                 | `#0F172A` (slate-900)          | `h1/h2` colour                 |
| Body text                    | `#1F2937` (gray-800)           | default body colour            |
| Muted text                   | `#64748B` / `#94A3B8`          | secondary labels               |
| Inverted body (on indigo)    | `#E0E7FF` (indigo-100)         | hero paragraph                 |
| Link / accent                | `#7480E7`                      | card link colour               |
| Neutral chip                 | bg `#F1F5F9`, text `#334155`   | `bg-slate-100 text-slate-700`  |
| Promo card (partner)         | `#4B48DD`, radius 24px         | in-feed ad card                |

Hover behaviour observed in class names: `hover:bg-slate-50` on rows, `hover:bg-slate-200`
on chips, `hover:bg-indigo-800` on primary pills. Focus: `focus:outline-2` with offset.

### Typography (measured)

- Family: `Inter` for every element; system fallback stack after it. Font faces loaded:
  Inter 100–900.
- Hero `h1`: **48px / 48px, weight 800**, white, tracking normal.
- Section `h2`: **48px / 48px, weight 800**, `#0F172A`.
- Card title `h3`: **16px / 22px, weight 700**.
- Page `h1` (database): **26px / 28.6px, weight 800**.
- Body: 16px / 24px, weight 400.
- Table text: 14px / 20px, weight 400.
- Chips: 12px / 16px, weight 600.
- Nav link: 14px / 20px, weight 700.
- Button: 16–18px, weight 600.
- **Takeaway:** a single geometric sans, extremely tight display tracking, heavy 800 display
  weights, small bold caps-like labels, and 12px semibold metadata.

### Layout (measured)

- Sticky white header: 65px tall, `border-b: 1px solid #E2E8F0`, no shadow.
- Content column at 800px viewport: 737px wide inside 24px page padding (`px-6`); content
  max-width behaves like `max-w-6xl` (~1152px) at desktop.
- Hero: two-column grid at `lg` (`grid-cols-2`, gap 64px); single column below.
- Card grid: 2 columns at 800px, cards **360px** wide with **16px** gap.
- Section rhythm: hero `py-20` (80px), inner sections ~64–80px vertical.
- Radius scale: cards **12px**, chips/buttons **9999px**, inputs **6px**, feature card **24px**.
- Shadow: cards **none**; primary pill `0 6px 16px rgba(20,16,90,0.22)`.
- Borders are 1px hairlines at low contrast; separation comes from background shift, not shadow.

### Components

1. **Sticky top bar** — logo mark + wordmark + version pill, ghost “Login”, solid pill CTA.
2. **Hero** — indigo field, 48px display headline, 20px indigo-100 subcopy, email capture +
   search entry, live dataset stats, mini data table with pill filters.
3. **Filter chips** — 12px semibold, `rounded-full`, indigo solid for the active chip, slate
   for the rest; used both for filtering and for suggested queries.
4. **Data table** — uppercase 11–12px column headers in muted slate, 14px cells, hairline row
   dividers, hover row tint, right-aligned numeric revenue, badge-style tags, “Build this” link.
5. **Category cards** — count label in 12px uppercase (“1,295 IDEAS”), 18–20px bold title,
   one-line description, muted “median” metric; whole card is a link.
6. **Story cards** — 16:9 image, 16px bold title over 2 lines, small muted source line.
7. **Stat summary panel** — white card, 12px radius, label in 12px uppercase, big numeric value,
   supporting sentence, distribution chips.
8. **Sort/filter bar** — borderless native `<select>` elements (`text-slate-900 font-medium`),
   “Sort By” label, active-filter count, list/rows view toggle (dark pill for active).
9. **Auth form** — narrow 460px column, minimal labels, full-width Google button, inline
   helper text, “log in without password” secondary action.
10. **Footer** — white, top hairline, one row of plain text links, small muted legal line.

### Responsive observations

- Header collapses to a hamburger button at `<lg`; search becomes an icon.
- At 1440px the hero is a balanced two-column composition; at 390px it stacks with the data
  preview below the search/CTA while retaining a strong display headline.
- Card grids: 1 column on mobile, 2 on tablet, 3 on desktop (verified visually and from
  `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Data table becomes a horizontally scrollable region with a compact card/rows toggle.
- Section padding drops from 80px to 48px on mobile.

### What THE SCENES adopts (principles, not assets)

- Indigo/slate editorial palette, white cards on a slate-50 canvas, hairline borders, 12px radius.
- Heavy tight display type over calm 16px body; 12px uppercase metadata labels.
- Search-first discovery, chip filters, dense but scannable data tables, stat summary panels.
- Flat surfaces, almost no shadows; hierarchy from type scale and spacing.
- Honest “live data” language and a visible data provenance line.

### What THE SCENES does not adopt

- Starter Story's logo, wordmark, copy, partner/advertising blocks, or exact layout.
- Their content model (business revenue case studies) — THE SCENES is community/learning.

---

## PART B — SKOOL (application structure reference)

Pages inspected

| URL                                           | Result                                                    |
| --------------------------------------------- | --------------------------------------------------------- |
| `https://www.skool.com/`                      | Public discovery: category rail, community cards, search  |
| `https://www.skool.com/aivideobootcamp/about` | Public community page: header, tabs, reviews, member wall |
| `https://www.skool.com/pricing`               | Two-tier plan structure, monthly/yearly toggle            |
| `https://www.skool.com/communities`           | Redirected/limited — not usable                           |

Access limitations: authenticated community interior (feed, classroom, calendar, members,
leaderboard, admin) is **not publicly accessible**. Findings for those surfaces are therefore
structural inference from public tab labels, public community pages, and the project's existing
`docs/SKOOL-CIRCLE-ANALYSIS.md`. They are recorded as **unverified** where applicable.

### Application architecture observed

**Public discovery (`/`)**

- Warm off-white canvas (`#F8F7F5` measured).
- Headline “Discover communities or create your own” with a plain text “create your own” link.
- Category rail: “🔥 Trending” plus ~25 topic chips (AI Automation, AI Video, Side Hustles,
  Ads & Marketing, Ecom, Trading, Business, Health & Fitness … “More…”).
- Large borderless search field, 18px/27px medium, 574px wide, no visible border or radius.
- Community cards: cover image, community name, one-line promise, member count, star rating
  with review count, and price (`$9/month`). Grid of 3 at desktop.
- Two persistent header actions: “Log In” (outline) and a primary signup action.
- The 390px capture retained a desktop-width discovery canvas and clipped it horizontally. That
  behaviour is evidence from Skool, but it is explicitly rejected for THE SCENES; the implemented
  discovery view reflows to one column without body overflow.

**Public community page (`/:slug/about`)**

- Community header: name, rating + review count, “Private” label, member count, price,
  “By <owner>”, primary join CTA.
- Horizontal tab navigation: **About · Community · Classroom · Calendar · Members ·
  Leaderboard · Map**.
- About tab: long-form pitch, bullet value list, member avatar wall, written reviews with
  ratings, pricing restated, sticky join CTA on desktop.
- Locked content: non-members see previews and a join gate rather than the feed.

**Pricing**

- Two plans (Hobby / Pro), monthly/yearly toggle with “2 months free” incentive, feature list
  per plan, transaction-fee difference as the main differentiator.
- (Skool's yellow accent is Skool's identity and is **not** reused.)

### Architecture adopted for THE SCENES (adapted, not cloned)

```
Public shell
  /                     landing
  /explore              discovery + category chips + search
  /search               cross-entity results
  /communities/:slug    public community page (tabs: About, Classroom preview, Events, Members)
  /creators/:handle     public creator profile
  /pricing              plans
  /marketplace          public marketplace
  /marketplace/:slug    product detail + checkout sheet

Auth shell
  /login  /register  /forgot-password  /onboarding

Member shell (community-scoped sidebar + top bar + mobile tab bar)
  /home                          member dashboard
  /c/:slug                       community feed
  /c/:slug/post/:postId          discussion
  /c/:slug/new                   create/edit post
  /c/:slug/members               directory
  /c/:slug/members/:memberId     member profile
  /c/:slug/calendar              calendar (month + list)
  /c/:slug/events/:eventId       event detail + RSVP
  /c/:slug/classroom             course library
  /c/:slug/classroom/:course     course overview
  /c/:slug/classroom/:course/:lesson  lesson viewer
  /c/:slug/leaderboard           rankings
  /notifications                 notification centre
  /my-learning                   cross-community learning

Creator / admin shell
  /workspace                     dashboard
  /workspace/community           settings (general, branding, access, features)
  /workspace/members             member management + moderation
  /workspace/courses             course library + builder
  /workspace/events              event management
  /workspace/commerce            subscriptions, orders, earnings, payouts, enterprise
```

Key interaction patterns adopted: community-scoped navigation, tabbed community surfaces,
feed with category filters and composer entry point, classroom with module/lesson tree and
progress, calendar with month/list toggle, leaderboard with period filter, creator workspace
with its own sidebar, and locked/preview states for non-members.

### Deliberate divergences from Skool

- No gamified emoji culture, no Skool yellow, no Skool copy.
- THE SCENES uses the Starter Story editorial/data visual language instead.
- THE SCENES exposes community, classroom, event, member and commerce surfaces as **original**
  interfaces with African-first positioning and a broader category taxonomy.
- Features not approved for the current phase (payments, live providers, payouts, messaging)
  are represented as **clearly-labelled preview states**, never as working integrations.

---

## Research → implementation mapping

| Research finding                     | Implementation decision                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| Inter + tight 800 display            | `Inter` body + `Inter Tight` display, 800 hero weight            |
| Indigo-700 hero field                | Landing hero and creator workspace header use `#4338CA`          |
| White cards / slate-50 canvas / 12px | `Card` primitive: `bg-white border border-slate-200 rounded-xl`  |
| Pill chips 12px semibold             | `Chip` primitive, indigo solid when active                       |
| Borderless selects, sort bar         | Explore / marketplace / admin toolbars                           |
| Dense data tables with hairline rows | Explore table view, member management, commerce orders           |
| Stat summary panel                   | Creator dashboard, commerce, course progress                     |
| Community tab rail                   | Community shell: Feed, Classroom, Calendar, Members, Leaderboard |
| Public preview + join gate           | Public community page; member routes show a sign-in gate         |
| 460px auth column                    | Auth shell with brand panel + narrow form                        |
| Mobile: stacked cards, icon search   | Responsive shells with drawer + bottom tab bar                   |

## Unverified assumptions (recorded, not claimed as fact)

1. Skool's authenticated feed/classroom/admin layouts were not directly inspected.
2. Starter Story's exact desktop container width (assumed ~1152px) was not measured at 1440px.
3. Starter Story hover/focus motion timings were not measured; a 150–200ms transition is used.
4. No screenshot artefacts exist for this session (capture API required a visible pane).
