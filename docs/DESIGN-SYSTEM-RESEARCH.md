# THE SCENES — Frontend Design System Research

## Research Completion Date
November 2, 2026

## Executive Summary

This document captures the visual design research from Starter Story and the application architecture research from Skool, synthesized for THE SCENES platform frontend design system.

---

## PART 1: STARTER STORY VISUAL RESEARCH

### Overview
Starter Story (starterstory.com) is a database platform showcasing revenue-generating businesses and founder stories. It serves as the primary visual design reference for THE SCENES.

### Visual Characteristics Observed

#### A. Layout & Structure
- **Content-First Design**: Clean, editorial layout prioritizing readability
- **Data Tables**: Structured presentation of business information (Revenue, Founder, Cost to start, Time to start, Type, Built with, Growth)
- **Card-Based UI**: Business/project cards with clear hierarchy
- **Database Aesthetic**: Organized, scannable information architecture
- **Live Data Indicators**: "Live · Updating now" status indicators
- **Search-First Navigation**: Prominent search functionality
- **Filter System**: Tag-based filtering (Micro-SaaS, No-code, $10K–$50K/mo, Solopreneur)

#### B. Typography (Inferred from Content)
- **Hierarchy**: Clear distinction between headings, body text, and metadata
- **Data Display**: Monospaced or tabular numerals for revenue figures
- **Readable Body Text**: Comfortable reading experience for case studies
- **Metadata Styling**: Smaller, muted text for supporting information

#### C. Color System (Inferred)
- **Data-Driven Aesthetic**: Professional, trustworthy color palette
- **Neutral Foundation**: Likely gray-scale base for readability
- **Accent Colors**: Used sparingly for CTAs and status indicators
- **Revenue Highlights**: Numbers presented prominently
- **Category Tags**: Colored or badged filtering elements

#### D. Components Identified
1. **Data Tables**
   - Multi-column layouts
   - Sortable columns
   - Expandable rows ("+ more" indicators)
   
2. **Business Cards**
   - Title/Idea
   - Revenue metrics
   - Founder information
   - Tools/Stack indicators
   - Growth channels

3. **Search & Filters**
   - Prominent search input
   - Tag-based filters
   - Active filter indicators

4. **Status Indicators**
   - "Live" badges
   - Update timestamps
   - Real-time data callouts

5. **CTAs**
   - "Build this" buttons
   - "Start today" actions
   - Email signup forms

#### E. Interaction Patterns
- **Hover States**: Likely on cards and table rows
- **Expandable Content**: "+ more" expansion patterns
- **Filter Toggling**: Interactive tag selection
- **Search**: Real-time or debounced search
- **Data Updates**: Live or periodic refresh indicators

### Pages Investigated
1. Homepage (starterstory.com)
2. Data/Database page (starterstory.com/data)
3. Individual business pages (referenced but not fully accessible)

### Key Takeaways for THE SCENES
- **Clean, Editorial Feel**: Content and data should breathe
- **Information Hierarchy**: Clear visual organization of complex information
- **Scannable Layouts**: Easy to browse and discover
- **Professional Aesthetic**: Trustworthy, credible presentation
- **Search-First**: Discovery through search and filtering

---

## PART 2: SKOOL APPLICATION ARCHITECTURE RESEARCH

### Overview
Skool is an all-in-one community and learning platform combining discussion, courses, events, gamification, and payments.

### Application Structure

#### A. Core Surfaces
1. **Community Feed**
   - Chronological post feed
   - Categories/channels for organization
   - Posts with text, images, videos, polls
   - Threaded comments and replies
   - Likes/reactions
   - Pinned announcements

2. **Classroom**
   - Course library
   - Module/lesson hierarchy
   - Video player with controls (speed, captions, progress)
   - Progress tracking
   - Lesson completion checkmarks
   - Resource attachments
   - Text lessons and downloadable files

3. **Calendar/Events**
   - Event scheduling interface
   - RSVP functionality
   - Event details pages
   - Recurring events support
   - Email reminders
   - Live rooms (up to 10,000 attendees)
   - Zoom/Meet embed support

4. **Leaderboard/Gamification**
   - Public leaderboard
   - Points system tied to activity
   - Levels with badges
   - Weekly/monthly/all-time rankings
   - Member recognition

5. **Chat/Messages**
   - Direct messages between members
   - Group chat rooms
   - Simple, focused messaging (not Discord-level complexity)

6. **Member Directory**
   - Browsable member list
   - Member profiles
   - Activity indicators

#### B. Navigation Architecture

**Primary Navigation** (likely sidebar or top nav):
- Community (feed)
- Classroom
- Calendar
- Leaderboard
- Chat
- Members

**User Navigation**:
- Profile
- Settings
- Notifications

**Admin/Creator Navigation** (additional):
- Analytics
- Member management
- Course builder
- Event management
- Email broadcasts
- Affiliate settings
- Pricing/payments

#### C. Information Architecture Patterns

**Three-Level Hierarchy**:
```
Community
  ├── Category 1
  │   └── Posts
  ├── Category 2
  │   └── Posts
  └── Category 3
      └── Posts

Classroom
  ├── Course 1
  │   ├── Module 1
  │   │   └── Lessons
  │   └── Module 2
  │       └── Lessons
  └── Course 2
      └── Modules/Lessons

Events
  ├── Upcoming Events
  ├── Past Events
  └── Recurring Events
```

#### D. Key User Journeys

**Learner Journey**:
1. Discover community (public preview or discovery page)
2. Request to join / Sign up
3. Complete onboarding (intro, profile setup, "Start Here" content)
4. Browse feed
5. Engage (post, comment, react)
6. Access classroom
7. Start course
8. Watch lessons, track progress
9. Attend events
10. Earn points, climb leaderboard

**Creator Journey**:
1. Create group
2. Set branding
3. Build first course (modules/lessons)
4. Set pricing
5. Invite founding members
6. Schedule events
7. Post to feed
8. Monitor analytics
9. Manage members
10. Send email broadcasts

#### E. Monetization Models Supported
1. **Paid Subscriptions**: Monthly/yearly recurring
2. **One-Time Course Purchases**: "Buy Now" courses
3. **Freemium Tiers**: Free + paid tiers in same group
4. **Multiple Pricing Levels**: Basic/Premium/VIP
5. **Affiliate System**: Member referrals + platform referrals

#### F. Component Inventory

**Content Components**:
- Post cards
- Comment threads
- Lesson cards
- Course cards
- Event cards
- Member cards

**Navigation Components**:
- Sidebar navigation
- Tab navigation
- Breadcrumbs
- Search bar

**Input Components**:
- Post composer (text, images, video embeds, polls)
- Comment input
- Message composer
- Search input

**Feedback Components**:
- Like/reaction buttons
- Points display
- Level badges
- Progress bars
- Completion checkmarks

**Admin Components**:
- Analytics dashboards
- Member management tables
- Course builder interface
- Event scheduler
- Email broadcast composer

#### G. Mobile Experience
- Native iOS and Android apps
- Mobile-responsive web app
- Push notifications
- Full feature parity with desktop

---

## PART 3: SYNTHESIS FOR THE SCENES

### Design Philosophy Integration

**From Starter Story** (Visual Language):
- Clean, editorial layouts
- Data-driven, scannable interfaces
- Professional, trustworthy aesthetic
- Clear information hierarchy
- Search and filter-first discovery

**From Skool** (Application Architecture):
- Unified community + learning experience
- Simple, focused navigation
- Gamification for engagement
- Three-level content hierarchy
- Mobile-first experience

**THE SCENES Original** (Product Identity):
- African-first, globally expandable
- Broader than AI (multiple categories)
- Practical, application-focused learning
- Creator economy emphasis
- Provider-flexible architecture

### Visual Design Direction

#### Color Strategy
- **Primary**: Trustworthy, professional (blues, grays)
- **Secondary**: Warm, inviting (for community aspects)
- **Accent**: Energetic, action-oriented (for CTAs, points, progress)
- **Neutral**: Readable, calm (backgrounds, surfaces, text)
- **Semantic**: Success (green), warning (amber), error (red), info (blue)

#### Typography Strategy
- **Display**: Bold, confident for headings
- **Body**: Readable, comfortable for long-form content
- **UI**: Clear, functional for buttons, labels, navigation
- **Data**: Tabular numerals for metrics, revenue, progress
- **Code**: Monospace for technical content (rephrased from competitive intelligence)

#### Component System Priorities
1. **Discovery Components** (Starter Story influence)
   - Community cards
   - Course cards
   - Creator cards
   - Search interfaces
   - Filter systems

2. **Learning Components** (Skool influence)
   - Lesson players
   - Progress indicators
   - Module navigation
   - Completion states

3. **Community Components** (Skool influence)
   - Post cards
   - Comment threads
   - Reaction systems
   - Member cards

4. **Navigation Components** (Both influences)
   - App shell navigation
   - Contextual navigation
   - Breadcrumbs
   - Tabs

5. **Gamification Components** (Skool influence)
   - Leaderboards
   - Points displays
   - Badges
   - Progress tracking

### Responsive Strategy
- **Mobile-First**: Design for mobile, enhance for desktop
- **Breakpoints**: 390px (mobile), 768px (tablet), 1440px (desktop)
- **Navigation**: Hamburger → sidebar → persistent sidebar
- **Cards**: Stack → 2-column → 3-column → 4-column
- **Tables**: Horizontal scroll → full display

---

## PART 4: PAGE-BY-PAGE DESIGN REQUIREMENTS

### Public Website (Starter Story Visual Language)

**01. Landing Page**
- Hero: Clear value proposition
- Preview: Community/course samples
- Discovery: Featured categories
- Trust: Testimonials, metrics
- CTA: Sign up, explore

**02. Explore/Discovery**
- Search: Prominent
- Filters: Category, type, level, price
- Results: Card grid
- Sorting: Relevance, popularity, new

**03. Search Results**
- Multi-type results (communities, courses, creators)
- Filters
- Empty states

**04. Public Community Page**
- Community header
- Description
- Member count
- Recent activity preview
- Courses/events offered
- Join CTA

**05. Public Creator Profile**
- Profile header
- Bio
- Communities
- Courses
- Reviews
- Follow/connect CTA

**06. Pricing**
- Plan comparison (if applicable)
- Feature breakdown
- FAQ
- CTA

**07-08. Auth (Registration/Login)**
- Clean, focused forms
- Social login options (if supported)
- Clear error states

**09. Onboarding**
- Profile setup
- Interest selection
- Community recommendations
- First actions

### Member Experience (Skool Application Architecture)

**10. Member Home/Dashboard**
- Recent activity feed
- Joined communities
- Continue learning
- Upcoming events
- Quick actions

**11. Community Feed**
- Post stream
- Category filters
- Post creation
- Engagement

**12. Individual Post**
- Post content
- Comments
- Reactions
- Related posts

**13. Create/Edit Post**
- Rich text editor
- Media upload
- Category selection
- Publish options

**14. Notifications**
- Activity list
- Read/unread
- Types: comments, mentions, events
- Quick actions

**15. Community Members**
- Member list
- Search/filter
- Member cards
- Quick message

**16. Member Profile**
- Profile info
- Activity
- Contributions
- Achievements

**17. Community Calendar**
- Month/week/list views
- Event cards
- RSVP status
- Filters

**18. Event Details**
- Event info
- Description
- Host
- Attendees
- RSVP CTA

### Classroom/Learning (Skool Classroom)

**19. Course Library**
- Course grid
- Progress indicators
- Continue learning
- Browse by category

**20. Course Overview**
- Course header
- Curriculum outline
- Instructor info
- Reviews
- Enroll CTA

**21. Lesson Viewer**
- Video player
- Lesson content
- Curriculum sidebar
- Progress tracking
- Prev/next navigation
- Resources

**22. Leaderboard**
- Rankings table
- User position
- Points/level
- Time filters

### Creator/Admin (Skool Creator Tools)

**23. Creator Dashboard**
- Overview metrics
- Recent activity
- Member growth
- Revenue (if applicable)
- Quick actions

**24. Community Settings**
- General settings
- Branding
- Access control
- Features

**25. Member Management**
- Member list
- Roles
- Actions
- Invitations

**26. Course Builder**
- Course library
- Module editor
- Lesson editor
- Publishing

**27. Event Management**
- Event list
- Create/edit
- Scheduling
- Attendees

### Commerce (Phase 7-8, Design Now)

**28. Marketplace**
- Product grid
- Search/filter
- Product cards
- Categories

**29. Product Details**
- Product info
- Creator
- Reviews
- Purchase CTA

**30. Commerce Dashboard**
- Revenue overview
- Transaction history
- Payout status
- Earnings breakdown

---

## PART 5: DESIGN TOKENS FOUNDATION

### Color Palette (To be refined in OpenPencil)

**Neutral Scale** (Starter Story influence):
- Gray 50 - 950 (backgrounds, text, borders)

**Primary** (Brand, CTAs):
- Blue scale (trust, action)

**Secondary** (Community, warmth):
- Teal or warm gray

**Accent** (Gamification, progress):
- Vibrant (orange, green, or purple)

**Semantic**:
- Success: Green
- Warning: Amber
- Error: Red
- Info: Blue

### Typography Scale

**Font Stack** (To be determined):
- System fonts or web fonts
- Sans-serif for UI
- Serif for editorial content (optional)
- Monospace for code

**Scale**:
- Display: 48-72px
- H1: 36-48px
- H2: 30-36px
- H3: 24-30px
- H4: 20-24px
- H5: 18-20px
- H6: 16-18px
- Body: 16px
- Small: 14px
- XSmall: 12px

### Spacing Scale
- 4px base unit
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

### Border Radius
- None: 0
- SM: 4px
- MD: 8px
- LG: 12px
- XL: 16px
- 2XL: 24px
- Full: 9999px

### Shadows
- SM: Subtle elevation
- MD: Card elevation
- LG: Modal/dropdown elevation
- XL: High elevation

---

## PART 6: RESEARCH LIMITATIONS

### What Could Not Be Verified
1. **Starter Story**:
   - Exact HEX color values (requires browser DevTools)
   - Exact font families and weights
   - Specific spacing measurements
   - Hover/interaction micro-animations

2. **Skool**:
   - Authenticated interior screens (could not access without account)
   - Exact UI measurements
   - Admin panel details
   - Mobile app specifics beyond reviews

### Research Sources
- Starter Story homepage: https://www.starterstory.com/
- Starter Story data page: https://www.starterstory.com/data
- Skool website: https://www.skool.com/ (limited access)
- Skool review: https://loriballen.com/what-is-skool/
- Skool guide: https://howtorhino.com/architecture-resources/how-to-build-a-community-on-skool/

---

## PART 7: NEXT STEPS

1. ✅ Project investigation complete
2. ✅ Reference website research complete
3. ⏭️ Load OpenPencil tools
4. ⏭️ Create new design file
5. ⏭️ Establish design tokens
6. ⏭️ Build component library
7. ⏭️ Design 30 primary pages
8. ⏭️ Create responsive variants
9. ⏭️ Build interactive prototypes
10. ⏭️ Prepare developer handoff

---

*Research compiled by: Kiro Design Agent*
*Date: November 2, 2026*
*Status: Research phase complete, ready for design execution*
