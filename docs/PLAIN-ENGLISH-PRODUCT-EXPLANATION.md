# The Scenes — Plain-English Product Explanation

This document explains The Scenes in simple language. It is for founders, operators, and stakeholders who need to understand the product without engineering jargon.

> Product vision lives here. For the current build stage, verified checks, percentage estimate and
> exact next step, use [`PROJECT-STATUS.md`](./PROJECT-STATUS.md).

---

## What is The Scenes?

The Scenes is an online platform where people discover useful knowledge, learn practical skills, participate in focused communities, and connect with teachers and creators who share their expertise.

Think of it as a place where someone interested in AI, design, business, coding, content creation, or other professional skills can:

- Find courses taught by real practitioners
- Join communities of people learning and working in the same field
- Attend live events and workshops
- Access practical resources, templates, and workflows
- Track their learning progress
- Eventually buy and sell digital products and knowledge

The Scenes is designed to work especially well for African users — on mobile phones, with variable internet speeds, and with local payment methods — while being useful to anyone in the world.

## What is The Scenes NOT?

- It is not an AI-only product. AI is one important category, but the platform supports many fields of knowledge.
- It is not a one-week demo or a fake dashboard. It is being built as a real product with real security, real data integrity, and real business operations.
- It is not a copy of Skool, Circle, or Kajabi. Those products are studied for good ideas, but The Scenes has its own identity and priorities.
- It is not a Ghana-only product. It starts with an African focus but serves anyone.

---

## What can users do?

### Learners

- **Discover** courses, communities, and creators across many categories
- **Join** communities focused on specific skills or interests
- **Learn** through structured courses with modules, lessons, and progress tracking
- **Apply** knowledge through practical assignments and projects
- **Attend** live sessions, workshops, and events
- **Access** resources, templates, and downloadable files
- **Track** their progress, completions, and achievements
- **Connect** with other learners and teachers

### Creators / Teachers

- **Teach** by publishing structured courses with lessons and modules
- **Build an audience** through communities, content, and live events
- **Publish** resources, workflows, templates, and digital products
- **Earn** through course sales, memberships, and digital products
- **Analyze** their audience, engagement, and earnings
- **Manage** their community, moderate discussions, and respond to students
- **Grow** through referral programs that unlock additional platform features

### Administrators

- **Manage** users, creators, and content across the platform
- **Moderate** communities, reports, and disputes
- **Monitor** platform health, provider usage, and analytics
- **Configure** categories, policies, and system settings
- **Oversee** payments, payouts, and referral programs

---

## How do communities work?

Communities are focused groups organized around a topic, skill, or creator. A community has:

- A **feed** where members post, comment, and react
- **Membership** — you join a community to participate
- **Moderation** — creators and moderators keep discussions productive
- **Rules** — each community can have guidelines for behavior
- **Discovery** — anyone can browse communities before joining

Communities are not isolated chatrooms. They connect to courses, events, and resources so learning and discussion happen together.

---

## How do courses work?

A course is a structured learning experience:

- **Modules** organize the course into sections
- **Lessons** are the individual learning units inside modules
- **Progress** is tracked — you can see what you have completed and what is next
- **Resources** like PDFs, files, and links are attached to lessons
- **Video** content is delivered through the platform (not dependent on one video provider)
- **Assignments** let learners apply what they learn

Creators build courses using a course builder in their workspace.

---

## How do events work?

Events are scheduled sessions — workshops, live classes, Q&A sessions, or community meetups.

- Events have **event pages** with details, registration, and scheduling
- Learners can **register** and receive **reminders**
- Live sessions connect through the platform's video/meeting system
- **Attendance** is tracked
- Events can be **one-time** or **recurring**

The platform does not depend on one video provider. It uses an internal system that can work with different providers (like Bunny.net, LiveKit, or others) so the product is not locked to one company.

---

## How do referrals work?

Creators and users can invite others to The Scenes using referral links.

Here is the important distinction:

**A referral earns a platform benefit** — like extra storage space, extra live-session capacity, or access to advanced features.

**A referral does NOT directly create more infrastructure.** Just because a creator earns "5,000 extra live minutes" as a reward does not mean the platform has magically received 5,000 more minutes from its video provider. The platform must always check:

1. Does the creator have the entitlement? (Yes, from referrals)
2. Does the platform actually have capacity right now? (Depends on infrastructure)
3. Is the creator within usage limits? (Checked against actual usage)

This separation exists to prevent the platform from making promises it cannot keep.

Referral qualification is not instant. A referral goes through stages:

- **Pending** — someone clicked the link
- **Qualified** — the referred person completed a meaningful action (like verifying their email)
- **Credited** — the reward is applied to the referrer's account

This prevents abuse like fake signups or self-referrals.

---

## How do marketplace products work?

Eventually, creators will be able to sell digital products:

- Templates
- Workflows
- Downloadable resources
- Premium content
- Memberships

When someone purchases a product:

- The platform takes a fee (the exact percentage is not yet decided — see open decisions)
- The creator receives their share
- The buyer gets access to the product
- Downloads are protected so only buyers can access them
- Refunds and disputes are handled through the platform

The marketplace is a later feature. It is not being built now, but the architecture accounts for it.

---

## How do payments eventually work?

Payments are intentionally postponed until the product foundation is solid.

When payments are activated:

- The platform will support **customer checkout** for courses, memberships, and products
- **Ghana/local payments** will be supported (Paystack and Flutterwave are historical references, but the exact provider is not yet selected)
- **International payments** will also be supported
- **Creator payouts** will track gross revenue, platform fees, taxes, refunds, and net earnings
- All financial operations will have **audit trails** and **reconciliation**

The exact fee structure, payout schedule, and minimum amounts are open product decisions.

---

## How does AI fit into the platform?

AI is both a **content category** (people can learn about AI on The Scenes) and a **capability** (the platform itself will use AI to help users).

Future AI features may include:

- A **learning assistant** that helps students with course material
- **Smart search** that understands what you are looking for
- **Recommendations** for courses and communities based on your interests
- **Content tools** that help creators build courses and resources
- **Workflow assistance** for practical tasks

The AI system is designed to work with multiple providers, not locked to one company. The specific AI model referenced in the old notes (GPT-4o mini) is historical — the current design does not hardcode any model.

AI features are a later phase. They are not being built now.

---

## How do files and video work?

### Files

Files (PDFs, resources, templates) are stored using Cloudflare R2, a cloud storage service.

- Files can be **private** (only accessible to authorized users) or **public**
- Access is controlled through **signed URLs** — temporary links that expire, preventing unauthorized sharing
- The platform tracks who owns each file, how much storage is used, and enforces quotas

### Video

Video is delivered through providers like Bunny.net, with the option to use others.

- The platform uses an **internal adapter** — a layer between the product and the video provider
- This means if one video provider has problems or the business needs change, the platform can switch without rebuilding everything
- Video content for courses is protected so only enrolled students can access it

---

## Why do "provider adapters" exist?

Imagine if the entire platform was built directly on top of one video company's tools. If that company changed its prices, shut down, or had problems, the entire platform would break.

Instead, The Scenes puts a thin layer between the product and each external service:

```
What users see (the platform)
      ↓
Internal service layer (our code)
      ↓
Provider adapter (translates between our code and the external service)
      ↓
External service (Supabase, Cloudflare R2, Bunny.net, etc.)
```

This means:

- We can switch providers without rewriting the entire product
- We can use multiple providers for different purposes
- Provider-specific details do not leak into the user experience
- Security credentials stay on the server, never exposed to users

---

## Why are quotas separate from referral rewards?

This is a critical business rule.

**Referral reward:** "You earned 5 GB of extra storage from your referrals."
**Infrastructure reality:** "The platform currently has 8 GB of available storage across all its accounts."

If 100 creators each earned 5 GB from referrals, that is 500 GB of promises — but the platform may only have 50 GB of actual capacity.

The system handles this by keeping two separate ledgers:

1. **What the creator has earned** (their entitlement)
2. **What the platform can actually deliver** (infrastructure capacity)

When a creator tries to use their entitlement, the system checks both. If infrastructure is temporarily full, the creator sees a clear message rather than a silent failure or unexpected charges.

This prevents:

- Over-promising capacity the platform does not have
- Accidentally triggering expensive overages on cloud services
- Making guarantees that depend on creating fake accounts to get more free capacity

---

## Why is security designed this way?

The Scenes handles:

- Personal information (profiles, messages)
- Financial data (payments, earnings)
- Creator content (courses, files, intellectual property)
- Community discussions (some private)

The security approach:

- **Server-side enforcement** — security rules run on the server, not just in the browser. Hiding a button in the UI is not the same as preventing access.
- **Object-level authorization** — the system checks "does this specific user have access to this specific resource?" not just "is this user logged in?"
- **Signed URLs** — file access links expire, preventing link sharing for private content
- **Audit logging** — important actions are recorded so problems can be investigated
- **Rate limiting** — prevents abuse like mass signups, spam, or scraping
- **No secrets in code** — passwords, API keys, and credentials are never stored in the source code or ordinary database fields

---

## What is being built now?

Phases 0–2 are complete: the project rules, design direction and 30-page fixture-backed application
are established and verified across desktop, tablet and mobile.

The current work is **Phase 3A**: turning the demonstration into a safe real-data learning slice. The
local safety setup is complete. The first database implementation is written but still needs its live
local execution test. After that minimum gate passes, the team will build the account → profile →
community → course → lesson-progress journey end to end. When that integration is ready, the agent
will ask for fresh staging access and verify it there. Production remains a separate later decision.

---

## What is intentionally postponed?

These features are real requirements but are being held for later phases:

- **Real user authentication** (Phase 3)
- **Real database and data storage** (Phase 3)
- **Email notifications** (Phase 4)
- **File uploads and storage** (Phase 4)
- **Creator tools and operations** (Phase 5)
- **Live video sessions** (Phase 6)
- **Payments and checkout** (Phase 7)
- **Marketplace and digital products** (Phase 8)
- **AI features** (Phase 9)
- **Organizations and multi-tenancy** (Phase 10)

This is deliberate. Building the interface first ensures the product makes sense before connecting it to complex backend systems.

---

## What remains undecided?

These questions need founder input before they can be implemented:

1. **What is the "tha…" community interaction?** — An unclear term from the original notes
2. **What does "Instant Payouts (SMS + 1%, GH 1)" mean?** — The exact payout business rule
3. **What is the marketplace revenue split?** — Platform fee percentage
4. **Should the platform have learning streaks?** — And if so, what rules?
5. **What is the advertising model?** — Or is there one at all?
6. **What are the auto-DM onboarding rules?** — Consent and frequency
7. **What can guest links access?** — Exact content boundaries
8. **What AI providers should be used?** — And privacy policy for user data
9. **What are the exact referral rewards?** — Amounts per tier/milestone
10. **Should there be public leaderboards?** — Privacy and motivation tradeoffs
11. **Should the platform issue certificates?** — And what do they mean?

These are documented in `docs/OPEN-PRODUCT-DECISIONS.md` and are waiting for founder review.
