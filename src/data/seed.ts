import type {
  Category,
  Community,
  Course,
  Creator,
  EventItem,
  Member,
  NotificationItem,
  Order,
  Plan,
  Post,
  Product,
} from "./types";

/**
 * The Scenes fixture catalogue.
 *
 * This file intentionally contains **no fabricated creators, communities, courses, posts, events or
 * products**. The platform was seeded with illustrative demo content during the frontend phase; that
 * content has been removed so no invented creator or course can be mistaken for a real one.
 *
 * Only platform-level configuration remains here:
 * - `categories`: the data-driven product taxonomy (counts are real, not illustrative).
 * - `plans`: the approved pricing direction.
 *
 * The local preview session is derived from the email the visitor types at sign-in (see
 * `signInDemo`), so no member record is fabricated here either.
 *
 * Real catalogue records are served from Supabase in connected modes (`loadCatalogForRoute` /
 * `adaptConnectedCatalog`). This fixture file is only read in `fixtures` mode.
 */

export const currentUserId = "preview-user";

/** Data-driven taxonomy. Community counts read zero because there are no published scenes yet. */
export const categories: Category[] = [
  {
    id: "cat-ai",
    name: "AI & Automation",
    slug: "ai-automation",
    blurb: "Agents, workflows and practical automation for real work.",
    hue: 246,
    communityCount: 0,
  },
  {
    id: "cat-design",
    name: "Design",
    slug: "design",
    blurb: "Product, brand and interface craft from working designers.",
    hue: 320,
    communityCount: 0,
  },
  {
    id: "cat-product",
    name: "Web & Product",
    slug: "web-product",
    blurb: "Build, ship and grow software products people use.",
    hue: 196,
    communityCount: 0,
  },
  {
    id: "cat-business",
    name: "Business & Freelancing",
    slug: "business-freelancing",
    blurb: "Clients, pricing, operations and independent income.",
    hue: 28,
    communityCount: 0,
  },
  {
    id: "cat-content",
    name: "Content & Media",
    slug: "content-media",
    blurb: "Video, writing, audio and the systems behind them.",
    hue: 344,
    communityCount: 0,
  },
  {
    id: "cat-data",
    name: "Data & Analytics",
    slug: "data-analytics",
    blurb: "Turn messy information into decisions you can defend.",
    hue: 168,
    communityCount: 0,
  },
  {
    id: "cat-career",
    name: "Career & Learning",
    slug: "career-learning",
    blurb: "Skills, transitions and the craft of learning in public.",
    hue: 96,
    communityCount: 0,
  },
];

/**
 * No creators are seeded. Real creator records arrive from the connected catalogue; the public
 * creator route returns a not-found state in fixtures mode until then.
 */
export const creators: Creator[] = [];

/** No communities are seeded. See `creators` above. */
export const communities: Community[] = [];

/** No courses are seeded. See `creators` above. */
export const courses: Course[] = [];

/** No community posts are seeded. Locally created posts (preview) are held in the app store. */
export const posts: Post[] = [];

/**
 * No member records are seeded.
 *
 * The local preview session (`currentMember`) is built from the signed-in preview identity in the
 * app store, so there is no fabricated person to add here. Community directories, leaderboards and
 * member pages read real records from the connected catalogue instead.
 */
export const members: Member[] = [];

/** No events are seeded. */
export const events: EventItem[] = [];

/** No products are seeded. */
export const products: Product[] = [];

/** No notifications are seeded. */
export const notifications: NotificationItem[] = [];

/** No orders are seeded. */
export const orders: Order[] = [];

/** The approved pricing direction. Plan prices/fees are product decisions, not demo content. */
export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    audience: "For your first community and a small audience.",
    priceLabel: "$0",
    priceNote: "Always free · priced in USD",
    fee: "10% platform fee on sales",
    features: [
      { label: "1 community workspace", included: true },
      { label: "Up to 100 members", included: true },
      { label: "Member directory and feed", included: true },
      { label: "Course structure with embedded video links", included: true },
      { label: "External event links and calendar", included: true },
      { label: "External file links and video embeds", included: true },
      { label: "Standard automatic payouts planned", included: true },
      { label: "Unlimited communities", included: false },
      { label: "Native file and video hosting", included: false },
      { label: "AI co-pilot features", included: false },
    ],
  },
  {
    id: "creator",
    name: "Creator",
    audience: "For creators running a real business on the platform.",
    priceLabel: "$29",
    priceNote: "Per month · billed in USD · checkout not yet available",
    fee: "5% platform fee on sales",
    highlighted: true,
    features: [
      { label: "Unlimited community groups", included: true },
      { label: "Unlimited members", included: true },
      { label: "Unlimited courses, modules and lessons", included: true },
      { label: "External video, file and live-session links", included: true },
      { label: "Native file and video hosting", included: false },
      { label: "Native live streaming and replay", included: false },
      { label: "Rich text and native document editor", included: true },
      { label: "International sales in local currencies", included: true },
      { label: "Instant withdrawals planned", included: true },
      { label: "AI thread summaries and co-pilot (Phase 9)", included: true },
    ],
  },
  {
    id: "studio",
    name: "Studio",
    audience: "For established creators running a full business.",
    priceLabel: "$99",
    priceNote: "Per month · billed in USD · checkout not yet available",
    fee: "2% platform fee on sales",
    features: [
      { label: "Everything in Creator", included: true },
      { label: "Advanced AI capabilities (Phase 9)", included: true },
      { label: "Priority support", included: true },
      { label: "Native live streaming and replay", included: false },
      { label: "Native file and video hosting", included: false },
    ],
  },
];

export const getCommunity = (slug: string) => communities.find((c) => c.slug === slug);
export const getCreator = (handle: string) => creators.find((c) => c.handle === handle);
export const getMember = (id: string) => members.find((m) => m.id === id);
export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);
export const getEvent = (id: string) => events.find((e) => e.id === id || e.slug === id);
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
