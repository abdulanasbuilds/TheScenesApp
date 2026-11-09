export type Category = {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  hue: number;
  communityCount: number;
};

export type Creator = {
  id: string;
  name: string;
  handle: string;
  headline: string;
  bio: string;
  location: string;
  verified: boolean;
  followers: number;
  communities: string[];
  expertise: string[];
};

export type PricingModel =
  | { type: "free" }
  | {
      type: "subscription" | "one-time";
      amount: number;
      interval?: "month" | "year";
    };

export type Community = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categorySlug: string;
  creatorHandle: string;
  members: number;
  online: number;
  postsPerWeek: number;
  rating: number;
  reviews: number;
  pricing: PricingModel;
  privacy: "public" | "private";
  languages: string[];
  founded: string;
  rules: string[];
  highlights: string[];
  accentHue: number;
  featured?: boolean;
  joined?: boolean;
};

export type Lesson = {
  id: string;
  slug?: string;
  title: string;
  duration: string;
  type: "video" | "reading" | "exercise";
  summary: string;
  body: string[];
  resources: { label: string; kind: string; meta: string; url?: string }[];
  free?: boolean;
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  slug: string;
  communitySlug: string;
  title: string;
  subtitle: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  categorySlug: string;
  instructorHandle: string;
  instructorName?: string;
  instructorHeadline?: string | null;
  instructorLocation?: string | null;
  instructorBio?: string | null;
  hours: number;
  students: number;
  rating: number;
  reviews: number;
  status: "published" | "draft";
  price: number | "included";
  modules: Module[];
  outcomes: string[];
  accentHue: number;
};

export type PostComment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  likes: number;
  replies?: PostComment[];
};

export type Post = {
  id: string;
  communitySlug: string;
  authorId: string;
  category: string;
  title?: string;
  body: string;
  createdAt: string;
  likes: number;
  comments: PostComment[];
  pinned?: boolean;
  attachment?: { label: string; kind: "image" | "file" | "link"; meta: string };
};

export type Member = {
  id: string;
  name: string;
  handle: string;
  role: "Owner" | "Admin" | "Moderator" | "Member";
  headline: string;
  bio: string;
  location: string;
  joined: string;
  points: number;
  level: number;
  status: "active" | "invited" | "paused";
  communities: string[];
  badges: string[];
  online: boolean;
};

export type EventItem = {
  id: string;
  slug: string;
  communitySlug: string;
  title: string;
  description: string;
  start: string;
  end: string;
  timezone: string;
  hostHandle: string;
  location: string;
  kind: "live" | "workshop" | "office-hours" | "meetup";
  attendees: number;
  capacity: number;
  replay?: boolean;
  accentHue: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  description: string;
  creatorHandle: string;
  category: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  sales: number;
  format: string;
  includes: string[];
  accentHue: number;
  bestseller?: boolean;
};

export type NotificationItem = {
  id: string;
  kind: "comment" | "mention" | "event" | "course" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
  actorId?: string;
};

export type Order = {
  id: string;
  date: string;
  customer: string;
  item: string;
  kind: "course" | "product" | "membership" | "event";
  amount: number;
  fee: number;
  status: "paid" | "pending" | "refunded";
};

export type Plan = {
  id: "free" | "pro" | "pro-plus";
  name: string;
  audience: string;
  priceLabel: string;
  priceNote: string;
  fee: string;
  highlighted?: boolean;
  features: { label: string; included: boolean | "addon" }[];
};
