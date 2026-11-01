# The Scenes � Skool & Circle Competitive Analysis

## PURPOSE

This document preserves the competitive analysis findings and explains how The Scenes incorporates insights from Skool and Circle while remaining a distinct product.

**Critical Rule:** The Scenes is NOT a Skool clone, NOT a Circle clone, and NOT a feature-for-feature copy of any competitor.

**Guiding Principle:** Use Skool as the primary interaction benchmark. Use selected Circle capabilities as the advanced structural layer.

---

## SKOOL AS INTERACTION BASELINE

### What Skool Does Well

**1. Unified Community Experience**

- Clean, focused feed
- Notifications that work
- Direct communication
- Community discovery
- Public/private community distinction
- Member management with screening

**The Scenes Adopts:** Community feed as the primary communication surface, member management, discovery model

**2. Structured Learning (Classroom)**

- Clear course/lesson hierarchy
- Folder organization
- Rich content (text, code blocks, embeds, attachments)
- Drip content for progressive unlock
- Structured navigation
- Resource attachments

**The Scenes Adopts:** Course/module/lesson structure, rich content capabilities, progressive access, structured navigation

**3. Calendar & Events**

- Clear event scheduling
- Recurring events support
- Event links
- Reminders
- Community event integration
- Workshop/coaching session support

**The Scenes Adopts:** Event scheduling, recurring events, reminders, community event integration

**4. Gamification That Motivates**

- Points system tied to activity
- Levels with requirements
- Leaderboard for recognition
- Rewards that unlock content
- Content unlocks as motivation

**The Scenes Adopts:** Points/levels/leaderboard framework, content unlock rewards

**Critical Difference:** The Scenes gamification must connect to _meaningful learning outcomes_, not arbitrary metrics

**5. Effective Onboarding**

- "Start Here" pinned content
- Required actions
- Intro prompts
- Membership questions
- Automated welcome communication

**The Scenes Adopts:** Pinned welcome content, required actions, membership questions, automated communication (with consent)

**6. Community Discovery**

- Discoverable communities
- Clear descriptions
- Keyword/tag system
- Public previews before joining

**The Scenes Adopts:** Public discovery, preview model, keyword structure

**7. Flexible Membership**

- Free communities
- Paid recurring memberships
- Freemium models
- Tiered access
- One-time/lifetime access

**The Scenes Adopts:** Flexible membership _concepts_

**Payment Activation:** Phase 7 (gated)

**8. Creator Analytics**

- Member growth tracking
- Engagement metrics
- Retention visibility
- Conversion tracking
- Visitor analytics
- Revenue reporting (when payments active)

**The Scenes Adopts:** Analytics framework for growth, engagement, retention, conversion

---

## CIRCLE AS STRUCTURAL ENHANCEMENT

### What Circle Adds

**1. Space Architecture (Hierarchical Organization)**

Circle demonstrates:

```
Community
  +-- Space Group
      +-- Space (Posts, Chat, Events, Courses)
```

**The Scenes Interpretation:**

- Communities can have sub-spaces for organization
- Spaces have _types_ (discussion, events, learning, resources)
- Not every community needs every space type
- Hierarchy is _optional structure_, not mandatory complexity

**Why This Matters:** Supports both simple communities (like Skool) AND complex organizations (like Circle) without forcing unnecessary structure on small communities.

**2. Layout System (Presentation Modes)**

Circle shows three reusable layouts:

- **Feed:** Active discussion (like Skool)
- **Card:** Visual discovery/library
- **List:** Structured information/directory

**The Scenes Adopts:** Reusable layout system as a _frontend presentation layer_

**Why This Matters:** Same data, different views. Courses can be cards, events can be lists, discussions are feeds.

**3. Rich Content Authoring**

Circle demonstrates:

- Headings, lists, dividers
- Formatted text
- Embedded media
- Downloadable resources
- Code blocks
- Bookmarking

**The Scenes Adopts:** Full rich content authoring as a _reusable content rendering layer_

**Implementation:** Central content renderer used by posts, lessons, resources, workflows

**4. Live Experience**

Circle shows:

- Event scheduling
- RSVP
- Live rooms
- Live streaming
- Recording
- Automatic replay publishing
- Calendar integration
- Reminders

**The Scenes Adopts:** Live session _concepts_

**Critical Difference:** Provider-abstracted (Bunny.net, LiveKit, Daily, Agora) rather than locked to one vendor

**5. Course Architecture**

Circle demonstrates:

- Modules
- Lessons
- Featured media
- Text + downloadable resources
- Progress tracking
- Completion state
- Draft mode
- Publishing workflow

**The Scenes Adopts:** Module/lesson structure with draft ? publish workflow

**Synthesis with Skool:** Combines Skool's clarity with Circle's publishing workflow

**6. Advanced Access Control**

Circle shows:

- Private content
- Membership-gated content
- Product-gated content
- Tiered access levels
- Invitation-specific access
- Onboarding destinations

**The Scenes Adopts:** Tiered access architecture

**Implementation:** Server-side authorization, RLS policies, object-level access control (Phase 3+)

**7. Invitation System**

Circle demonstrates:

- Invitation URLs
- Invitation-specific access
- Onboarding routes
- Coupon/free-trial logic (future)

**The Scenes Adopts:** Invitation system with onboarding routing

**Payment Integration:** Deferred to Phase 7

---

## WHAT THE SCENES DELIBERATELY REJECTS

### From Skool

**? Vendor Lock-in**

- Skool provides video hosting; The Scenes uses provider adapters

**? Limited Space Architecture**

- Skool has flat communities; The Scenes supports optional hierarchy

**? Single Layout**

- Skool has one feed view; The Scenes has multiple layout modes

**? Closed Platform**

- Skool is a hosted SaaS; The Scenes is designed for self-hosting with provider flexibility

### From Circle

**? Complexity for Small Communities**

- Circle forces space groups even when unnecessary; The Scenes makes hierarchy optional

**? Overwhelming Admin UI**

- Circle's admin interface is complex; The Scenes prioritizes clarity

**? Vendor Lock-in**

- Circle controls hosting/infrastructure; The Scenes uses replaceable adapters

---

## THE SCENES DIFFERENTIATION

### What Makes The Scenes Distinct

**1. African-First, Globally Expandable**

- Mobile-first design
- Low-bandwidth optimization
- Variable connectivity resilience
- Local payment support (Phase 7)
- International expansion without architectural limits

**2. Broader Than AI**

- AI is a flagship category, not the company boundary
- Supports: design, web/product, business, content, creative skills, professional knowledge
- Data-driven category expansion

**3. Practical Application Focus**

- Not just learning ? doing
- Project/showcase workflows
- Feedback loops
- Real-world application

**4. Creator Economy**

- Referral system with platform entitlements
- Digital product marketplace (Phase 8)
- Creator payout system (Phase 8)
- Workflow/template sales

**5. Unified Discovery**

- Cross-community search
- Intelligent recommendations (Phase 9)
- Category-based discovery
- Creator profiles as discovery entry points

**6. Portable Provider Architecture**

- No vendor lock-in
- Replaceable authentication (currently Supabase)
- Replaceable storage (currently R2)
- Replaceable video (Bunny.net, LiveKit, Daily, Agora)
- Replaceable email (currently Resend)
- Replaceable payments (Phase 7, TBD)

**7. Referral Reward System**

- Platform entitlements vs provider capacity (unique architecture)
- Zero-cost mode enforcement
- Fraud prevention
- Transparent capacity status

**8. Resource & Workflow Libraries**

- Not just courses
- Downloadable templates
- Practical workflows
- Reusable resources
- Future marketplace (Phase 8)

---

## FEATURE SYNTHESIS STRATEGY

### How to Handle Feature Overlap

When Skool and Circle both have a feature:

**Example: Events/Calendar**

**Skool has:** Calendar, events, recurring events, links, reminders
**Circle has:** Event scheduling, RSVP, live rooms, replay publishing

**The Scenes combines:**

- Skool's clarity (simple calendar, reminders)
- Circle's depth (RSVP, live integration, replay)
- The Scenes addition (provider-abstracted live, mobile-first)

**Result:** One unified Events Domain

### Domain Unification

```
Skool "Classroom" + Circle "Courses"
  ? The Scenes Learning Domain

Skool "Calendar" + Circle "Events"
  ? The Scenes Events Domain

Skool "Gamification" + Circle "Engagement"
  ? The Scenes Engagement Domain

Skool "Community" + Circle "Spaces"
  ? The Scenes Community/Space Domain
```

**Rule:** Do NOT build two independent systems. Build one The Scenes system that synthesizes the best ideas.

---

## COMPETITIVE FEATURE MAP

| Capability               | Skool             | Circle        | The Scenes                 |
| ------------------------ | ----------------- | ------------- | -------------------------- |
| **Community Feed**       | ? Excellent       | ? Good        | ? Adopts Skool baseline    |
| **Hierarchical Spaces**  | ? No              | ? Yes         | ? Optional hierarchy       |
| **Rich Content**         | ? Good            | ? Excellent   | ? Reusable renderer        |
| **Course Structure**     | ? Excellent       | ? Good        | ? Combines both            |
| **Events**               | ? Good            | ? Excellent   | ? Combines both            |
| **Live Sessions**        | ?? External links | ? Integrated  | ? Provider-abstracted      |
| **Gamification**         | ? Excellent       | ?? Basic      | ? Adopts Skool + purpose   |
| **Onboarding**           | ? Excellent       | ? Good        | ? Adopts Skool baseline    |
| **Discovery**            | ? Good            | ? Good        | ? Enhanced cross-community |
| **Membership Models**    | ? Flexible        | ? Flexible    | ? Flexible (Phase 7)       |
| **Analytics**            | ? Good            | ? Excellent   | ? Combines both            |
| **Mobile Experience**    | ? Good            | ?? Acceptable | ? Mobile-first             |
| **Access Control**       | ?? Basic          | ? Advanced    | ? Advanced + server-side   |
| **Invitations**          | ? Good            | ? Excellent   | ? Combines both            |
| **Provider Flexibility** | ? Locked          | ? Locked      | ? Adapter-based            |
| **Self-Hosting**         | ? No              | ? No          | ? Designed for it          |
| **Referral System**      | ? No              | ? No          | ? Unique architecture      |
| **Marketplace**          | ? No              | ?? Limited    | ? Full (Phase 8)           |
| **AI Integration**       | ? No              | ? No          | ? Planned (Phase 9)        |

**Legend:**

- ? Excellent/Present
- ?? Acceptable/Limited
- ? Missing/Weak

---

## REQUIREMENTS TRACEABILITY

### Skool-Derived Requirements

All Skool-derived requirements receive IDs starting with:

**SC-KOOL-**

Examples:

- SC-KOOL-COMM-001: Community feed
- SC-KOOL-CLASS-001: Course structure
- SC-KOOL-CAL-001: Event calendar
- SC-KOOL-GAME-001: Points system
- SC-KOOL-ONBOARD-001: Start Here pinned content

### Circle-Derived Requirements

All Circle-derived requirements receive IDs starting with:

**SC-IRCLE-**

Examples:

- SC-IRCLE-SPACE-001: Hierarchical space architecture
- SC-IRCLE-LAYOUT-001: Card/List/Feed layouts
- SC-IRCLE-LIVE-001: Live rooms with replay
- SC-IRCLE-ACCESS-001: Tiered access control
- SC-IRCLE-INVITE-001: Invitation system

### The Scenes Original Requirements

All original The Scenes requirements receive IDs starting with:

**TS-**

(Already established in PRODUCT-REQUIREMENTS.md)

---

## IMPLEMENTATION PRIORITY

### Phase 1-2 (Design + Frontend with Fixtures)

**From Skool:**

- Community feed
- Course/lesson structure
- Event calendar
- Gamification UI
- Onboarding flow

**From Circle:**

- Space organization (design)
- Layout system (card/list/feed)
- Rich content authoring

**The Scenes Unique:**

- Mobile-first responsive design
- Category-based discovery
- Cross-community navigation

### Phase 3 (Backend Foundation)

**From Skool:**

- Membership management
- Progress tracking
- Completion state

**From Circle:**

- Access control model
- Invitation system
- Content gating

**The Scenes Unique:**

- Server-side authorization
- RLS policies
- Referral qualification logic

### Phase 4-5 (Creator Operations)

**From Skool:**

- Creator analytics
- Member management

**From Circle:**

- Publishing workflow
- Draft mode
- Advanced content management

**The Scenes Unique:**

- Referral dashboard
- Entitlement tracking
- Creator workspace

### Phase 6 (Live/Media)

**From Skool:**

- Event reminders
- Calendar integration

**From Circle:**

- Live rooms
- Recording/replay
- Automatic replay publishing

**The Scenes Unique:**

- Provider-abstracted live (Bunny, LiveKit, Daily, Agora)
- Capacity-aware session routing
- Mobile-optimized live experience

### Phase 7-8 (Payments + Marketplace)

**From Skool:**

- Flexible membership models
- Revenue analytics

**From Circle:**

- Product-gated access
- Tiered pricing

**The Scenes Unique:**

- Digital product marketplace
- Workflow/template sales
- Creator payout system

### Phase 9 (AI + Search)

**The Scenes Unique:**

- AI-powered search
- Intelligent recommendations
- Learning assistant
- Content generation tools

---

## COMPETITIVE POSITIONING

### vs Skool

**Similarities:**

- Clear, focused community experience
- Strong gamification
- Excellent onboarding
- Creator-friendly

**Advantages:**

- Hierarchical organization (optional)
- Multiple layout modes
- Provider flexibility
- Self-hosting capable
- Broader than single-niche
- African-first considerations
- Marketplace

### vs Circle

**Similarities:**

- Advanced space architecture
- Rich content authoring
- Strong access control
- Live integration

**Advantages:**

- Simpler for small communities (optional hierarchy)
- Skool-quality onboarding
- Better gamification
- Provider flexibility
- Mobile-first
- African-first considerations
- Zero-cost mode for rewards

### vs Both

**The Scenes Unique Strengths:**

1. Provider-portable architecture
2. Referral/entitlement system
3. Zero-cost reward infrastructure
4. African-first/global design
5. Broader category support
6. Practical application focus
7. Future AI integration
8. Self-hosting with cloud flexibility
9. Mobile-first from day one
10. Open architecture for future innovation

---

## DESIGN PRINCIPLES FROM COMPETITIVE ANALYSIS

### From Skool: Clarity

- Clean information architecture
- Focused user flows
- Clear calls-to-action
- Minimal cognitive load
- Obvious next steps

### From Circle: Flexibility

- Optional structure
- Multiple presentation modes
- Rich customization
- Advanced capabilities when needed
- Simple by default, powerful when required

### The Scenes: Purpose

- Every feature must serve a user/creator/community need
- Gamification tied to learning outcomes
- Community tied to practical application
- Content tied to real-world skills
- Platform tied to creator sustainability

---

## ANTI-PATTERNS TO AVOID

### From Skool

**? Oversimplification**

- Don't remove hierarchy just because Skool lacks it
- Don't limit content richness for "simplicity"
- Don't constrain creator tools

### From Circle

**? Overcomplexity**

- Don't force space groups on simple communities
- Don't make admin UI overwhelming
- Don't require advanced features for basic use

### From Both

**? Vendor Lock-in**

- Never hardcode provider assumptions
- Always use adapters
- Always plan for replacement

**? Feature Bloat**

- Only add features with clear user value
- Remove features that don't serve the core loops
- Resist "because competitor has it"

---

## UPDATE RULE

When new competitive intelligence is gathered:

1. Document in this file
2. Trace to PRODUCT-REQUIREMENTS.md
3. Update FEATURE-MATRIX.md priority/phase
4. Reassess differentiation strategy
5. Document in DECISIONS.md if architecture changes

---

## CONCLUSION

**The Scenes is:**

- Inspired by Skool's clarity
- Enhanced by Circle's structure
- Differentiated by its African-first, provider-flexible, creator-economy architecture
- Built for practical learning and real-world application
- Broader than any single competitor

**The Scenes is NOT:**

- A feature-for-feature clone
- Limited to one interaction model
- Locked to one vendor
- Constrained to one category
- A copy of anyone else's vision
