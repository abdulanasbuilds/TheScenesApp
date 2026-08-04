import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { recordOrganicTraffic, isPauseError, runLegitimateHeartbeat } from "@/lib/activity-resilience";
import {
  sendWelcomeEmail,
  sendEnrollmentEmail,
  sendCommunityJoinEmail,
  sendPaymentReceiptEmail,
} from "@/lib/email.functions";
import { onMemberJoin } from "@/lib/autodm.functions";
import { initiatePaystackPayment, isPaystackConfigured, priceStringToAmount } from "@/lib/paystack";
import { initializePayment, verifyAndRecordPayment } from "@/lib/monetization.functions";

// ─── Core Types ──────────────────────────────────────────────────────────────

export type Community = {
  id: number;
  title: string;
  category: string;
  members: number;
  creator: string;
  creatorEmail: string;
  avatar: string;
  banner: string;
  tag: "FREE" | "PAID";
  price?: string;
  summary: string;
  createdAt: number;
  // branding & access (Skool/Circle parity)
  color?: string; // hex brand color, e.g. "#3B82F6"
  coverImageUrl?: string; // cover photo URL (1084×576 recommended)
  iconUrl?: string; // square community icon (128×128 recommended)
  isPrivate?: boolean; // true = hidden from Discover search
  discoveryKeywords?: string[]; // up to 11 keywords for search / SEO (Skool parity)
  screeningQuestions?: string[]; // up to 3 join-request questions
  welcomeMessage?: string; // auto-DM sent when a member joins
};

export type SessionUser = {
  name: string;
  email: string;
  avatar: string;
  role: "creator" | "learner";
  photoUrl?: string;
  bio?: string;
};

export type AccessRecord = {
  id: number;
  resourceId: number;
  resourceTitle: string;
  resourceType: "lesson" | "community";
  communityId?: number;
  userEmail: string;
  accessedAt: number;
};

export type FeedPost = {
  id: number;
  communityId: number;
  channel: string;
  author: string;
  role: string;
  avatar: string;
  title: string;
  category: string;
  likes: number;
  comments: number;
  body: string;
  createdAt: number;
};

export type Comment = {
  id: number;
  postId: number;
  author: string;
  avatar: string;
  body: string;
  createdAt: number;
};

export type Reaction = {
  postId: number;
  userEmail: string;
  emoji: string;
};

export type NotificationType =
  | "welcome"
  | "system"
  | "new_post"
  | "new_comment"
  | "new_member"
  | "new_message"
  | "event"
  | "course_published"
  | "lesson_published"
  | "payment_success"
  | "payment_failed"
  | "announcement"
  | "community_live"
  | "onboarding";

export type AppNotification = {
  id: number;
  text: string;
  time: string;
  read: boolean;
  // Optional enrichment — older rows won't have these
  type?: NotificationType;
  link?: string; // deep-link route, e.g. "/app/messages"
  actorName?: string; // display name of who triggered this
};

export type DirectMessage = {
  id: number;
  fromEmail: string;
  toEmail: string;
  body: string;
  read: boolean;
  createdAt: number;
};

export type Conversation = {
  peerEmail: string;
  lastMessage: DirectMessage;
  unreadCount: number;
};

export type ResourceSource =
  "gdrive" | "dropbox" | "onedrive" | "notion" | "github" | "canva" | "figma" | "other";

export type LessonResource = {
  id: number;
  title: string;
  url: string;
  source: ResourceSource;
  addedAt: number;
  /** legacy alias for title, kept for editor compat */
  label?: string;
};

export type Lesson = {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  resources: LessonResource[];
  published: boolean;
  order: number;
  dripDays: number; // 0 = available immediately; N = unlocks N days after enrollment
  /** legacy alias for description (rich text body), kept for editor compat */
  body?: string;
  /** legacy: true when the lesson is gated/unpublished, kept for editor compat */
  locked?: boolean;
  /** legacy: id of the containing module, kept for editor compat */
  moduleId?: number;
};

export type CourseModule = {
  id: number;
  title: string;
  lessons: Lesson[];
  order: number;
};
/** Legacy alias — some editor code imports `Module`. */
export type Module = CourseModule;

export type Course = {
  id: number;
  communityId: number | null;
  title: string;
  description: string;
  creatorEmail: string;
  modules: CourseModule[];
  published: boolean;
  enrollmentCount: number;
  createdAt: number;
  coverImageUrl?: string; // custom thumbnail URL
  thumbnail?: string; // gradient-class fallback (e.g. "from-blue-500 to-violet-600")
  /** legacy alias for coverImageUrl, kept for editor compat */
  cover?: string;
};

export type CommunityResource = {
  id: number;
  communityId: number;
  title: string;
  url: string;
  source: ResourceSource;
  addedAt: number;
};

export type EventHostPlatform = "native" | "zoom" | "meet" | "youtube" | "custom";
export type EventVisibility = "all" | "premium";

export type CommunityEvent = {
  id: number;
  communityId: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: "session" | "deadline" | "meetup" | "personal";
  hostPlatform: EventHostPlatform;
  meetingUrl?: string;
  visibility: EventVisibility;
  createdAt: number;
};

export type Enrollment = {
  courseId: number;
  userEmail: string;
  completedLessonIds: number[];
  enrolledAt: number;
};

// ─── Auth Internals ───────────────────────────────────────────────────────────

type StoredAccount = {
  email: string;
  name: string;
  password: string;
  role: "creator" | "learner";
  photoUrl?: string;
  bio?: string;
};

export type SignInResult = SessionUser | "not_found" | "wrong_password";
export type SignUpResult = SessionUser | "email_taken";

// ─── Persisted State ──────────────────────────────────────────────────────────

const STORAGE_KEY = "sukaspace_app_state_v3";

const BANNERS = [
  "from-sky-100 to-blue-50",
  "from-emerald-100 to-teal-50",
  "from-amber-100 to-orange-50",
  "from-cyan-100 to-sky-50",
  "from-lime-100 to-emerald-50",
  "from-slate-100 to-blue-50",
];

export function randomBanner() {
  return BANNERS[Math.floor(Math.random() * BANNERS.length)];
}

// Monotonically increasing ID generator. Date.now() alone can produce the same
// millisecond timestamp for two records created back-to-back (e.g. rapid
// clicks, scripted/automated actions), which caused duplicate IDs. This
// guarantees uniqueness within a session by bumping a counter whenever the
// clock hasn't advanced since the last call.
let lastGeneratedId = 0;
export function generateId(): number {
  const now = Date.now();
  lastGeneratedId = now > lastGeneratedId ? now : lastGeneratedId + 1;
  return lastGeneratedId;
}

export function detectResourceSource(url: string): ResourceSource {
  if (url.includes("drive.google.com")) return "gdrive";
  if (url.includes("dropbox.com")) return "dropbox";
  if (url.includes("onedrive.live.com") || url.includes("1drv.ms")) return "onedrive";
  if (url.includes("notion.so") || url.includes("notion.site")) return "notion";
  if (url.includes("github.com") || url.includes("gist.github")) return "github";
  if (url.includes("canva.com")) return "canva";
  if (url.includes("figma.com")) return "figma";
  return "other";
}

export function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const loom = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  return null;
}

type PersistedState = {
  session: SessionUser | null;
  accounts: StoredAccount[];
  userCommunities: Community[];
  extraPosts: FeedPost[];
  likedPostIds: number[];
  joinedCommunityIds: number[];
  notifications: AppNotification[];
  courses: Course[];
  comments: Comment[];
  reactions: Reaction[];
  communityEvents: CommunityEvent[];
  communityResources: CommunityResource[];
  enrollments: Enrollment[];
  accessRecords: AccessRecord[];
  directMessages: DirectMessage[];
  // Onboarding
  onboardingCompleted: boolean;
  onboardingInterests: string[];
  // Notification preferences (persisted to profiles.notification_prefs)
  notificationPrefs: Record<string, boolean>;
};

function defaultState(): PersistedState {
  return {
    session: null,
    accounts: [],
    userCommunities: [],
    extraPosts: [],
    likedPostIds: [],
    joinedCommunityIds: [],
    notifications: [],
    courses: [],
    comments: [],
    reactions: [],
    communityEvents: [],
    communityResources: [],
    enrollments: [],
    accessRecords: [],
    directMessages: [],
    onboardingCompleted: false,
    onboardingInterests: [],
    notificationPrefs: { posts: true, dms: true, comments: true, sales: true },
  };
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

// ─── Supabase <-> app-shape mapping ────────────────────────────────────────────
// Row ids stay client-generated numbers (see generateId above) so nested
// module/lesson updates don't need to change shape when a real database is
// wired in — see supabase/schema.sql for the table definitions these map to.

function communityToRow(c: Community) {
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    members: c.members,
    creator: c.creator,
    creator_email: c.creatorEmail,
    avatar: c.avatar,
    banner: c.banner,
    tag: c.tag,
    price: c.price ?? null,
    summary: c.summary,
    created_at: c.createdAt,
    color: c.color ?? null,
    cover_image_url: c.coverImageUrl ?? null,
    icon_url: c.iconUrl ?? null,
    is_private: c.isPrivate ?? false,
    discovery_keywords: c.discoveryKeywords ?? [],
    screening_questions: c.screeningQuestions ?? [],
    welcome_message: c.welcomeMessage ?? null,
  };
}
function communityFromRow(r: any): Community {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    members: r.members,
    creator: r.creator,
    creatorEmail: r.creator_email,
    avatar: r.avatar,
    banner: r.banner,
    tag: r.tag,
    price: r.price ?? undefined,
    summary: r.summary,
    createdAt: r.created_at,
    color: r.color ?? undefined,
    coverImageUrl: r.cover_image_url ?? undefined,
    iconUrl: r.icon_url ?? undefined,
    isPrivate: r.is_private ?? false,
    discoveryKeywords: r.discovery_keywords ?? [],
    screeningQuestions: r.screening_questions ?? [],
    welcomeMessage: r.welcome_message ?? undefined,
  };
}
function postToRow(p: FeedPost) {
  return {
    id: p.id,
    community_id: p.communityId,
    channel: p.channel,
    author: p.author,
    role: p.role,
    avatar: p.avatar,
    title: p.title,
    category: p.category,
    likes: p.likes,
    comments: p.comments,
    body: p.body,
    created_at: p.createdAt,
  };
}
function postFromRow(r: any): FeedPost {
  return {
    id: r.id,
    communityId: r.community_id,
    channel: r.channel,
    author: r.author,
    role: r.role,
    avatar: r.avatar,
    title: r.title,
    category: r.category,
    likes: r.likes,
    comments: r.comments,
    body: r.body,
    createdAt: r.created_at,
  };
}
function commentToRow(c: Comment, postId: number) {
  return {
    id: c.id,
    post_id: postId,
    author: c.author,
    avatar: c.avatar,
    body: c.body,
    created_at: c.createdAt,
  };
}
function commentFromRow(r: any): Comment {
  return {
    id: r.id,
    postId: r.post_id,
    author: r.author,
    avatar: r.avatar,
    body: r.body,
    createdAt: r.created_at,
  };
}
function eventToRow(e: CommunityEvent) {
  return {
    id: e.id,
    community_id: e.communityId,
    title: e.title,
    description: e.description ?? null,
    event_date: e.date,
    event_time: e.time ?? null,
    type: e.type,
    host_platform: e.hostPlatform,
    meeting_url: e.meetingUrl ?? null,
    visibility: e.visibility,
    created_at: e.createdAt,
  };
}
function eventFromRow(r: any): CommunityEvent {
  return {
    id: r.id,
    communityId: r.community_id,
    title: r.title,
    description: r.description ?? undefined,
    date: r.event_date,
    time: r.event_time ?? undefined,
    type: r.type,
    hostPlatform: (r.host_platform ?? "native") as EventHostPlatform,
    meetingUrl: r.meeting_url ?? undefined,
    visibility: (r.visibility ?? "all") as EventVisibility,
    createdAt: r.created_at,
  };
}

function communityResourceToRow(res: CommunityResource) {
  return {
    id: res.id,
    community_id: res.communityId,
    title: res.title,
    url: res.url,
    source: res.source,
    added_at: res.addedAt,
  };
}
function communityResourceFromRow(r: any): CommunityResource {
  return {
    id: r.id,
    communityId: r.community_id,
    title: r.title,
    url: r.url,
    source: r.source,
    addedAt: r.added_at,
  };
}
function dmToRow(dm: DirectMessage) {
  return {
    id: dm.id,
    from_email: dm.fromEmail,
    to_email: dm.toEmail,
    body: dm.body,
    read: dm.read,
    created_at: dm.createdAt,
  };
}
function dmFromRow(r: any): DirectMessage {
  return {
    id: r.id,
    fromEmail: r.from_email,
    toEmail: r.to_email,
    body: r.body,
    read: r.read,
    createdAt: r.created_at,
  };
}
function courseToRow(c: Course) {
  return {
    id: c.id,
    community_id: c.communityId,
    title: c.title,
    description: c.description,
    creator_email: c.creatorEmail,
    published: c.published,
    enrollment_count: c.enrollmentCount,
    created_at: c.createdAt,
    cover_image_url: c.coverImageUrl ?? null,
    thumbnail: c.thumbnail ?? null,
  };
}
function courseFromRow(r: any): Course {
  const modules = (r.modules || [])
    .slice()
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((m: any): CourseModule => ({
      id: m.id,
      title: m.title,
      order: m.sort_order,
      lessons: (m.lessons || [])
        .slice()
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((l: any): Lesson => ({
          id: l.id,
          title: l.title,
          description: l.description || "",
          videoUrl: l.video_url || "",
          published: l.published,
          order: l.sort_order,
          dripDays: l.drip_days ?? 0,
          resources: (l.lesson_resources || []).map((res: any): LessonResource => ({
            id: res.id,
            title: res.title,
            url: res.url,
            source: res.source,
            addedAt: res.added_at,
          })),
        })),
    }));
  return {
    id: r.id,
    communityId: r.community_id,
    title: r.title,
    description: r.description || "",
    creatorEmail: r.creator_email || "",
    published: r.published,
    enrollmentCount: r.enrollment_count,
    createdAt: r.created_at,
    modules,
    coverImageUrl: r.cover_image_url ?? undefined,
    thumbnail: r.thumbnail ?? undefined,
  };
}

// Fire a Supabase write in the background. State is already updated
// optimistically before this runs, so a failure here means "not synced to
// the database yet", not "the UI is wrong" — surface it without blocking.
function sync(promise: PromiseLike<{ error: unknown }> | undefined, label: string) {
  if (!promise) return;
  promise.then(
    (res) => {
      if (res?.error) {
        console.error(`[SukaSpace] Supabase ${label} failed:`, res.error);
        toast.error(
          `Couldn't sync "${label}" to your database. It's saved on this device for now.`,
        );
      }
    },
    (err: unknown) => console.error(`[SukaSpace] Supabase ${label} failed:`, err),
  );
}

// ─── Store Interface ──────────────────────────────────────────────────────────

type CreateCommunityInput = {
  title: string;
  category: string;
  summary: string;
  tag: "FREE" | "PAID";
  price?: string;
  color?: string;
  coverImageUrl?: string;
  iconUrl?: string;
  isPrivate?: boolean;
  discoveryKeywords?: string[];
  screeningQuestions?: string[];
  welcomeMessage?: string;
};

type AppStoreValue = {
  // state
  session: SessionUser | null;
  communities: Community[];
  posts: FeedPost[];
  notifications: AppNotification[];
  unreadCount: number;
  isHydrated: boolean;
  isDatabasePaused: boolean;
  joinedCommunityIds: number[];
  courses: Course[];
  communityResources: CommunityResource[];
  communityEvents: CommunityEvent[];
  enrollments: Enrollment[];
  // auth
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (
    name: string,
    email: string,
    password: string,
    role: "creator" | "learner",
  ) => Promise<SignUpResult>;
  signOut: () => void;
  updateProfile: (patch: {
    name?: string;
    bio?: string;
    photoUrl?: string;
    role?: "creator" | "learner";
  }) => void;
  getAccountRole: (email: string) => "creator" | "learner" | undefined;
  // access records
  accessRecords: AccessRecord[];
  trackResourceAccess: (input: {
    resourceId: number;
    resourceTitle: string;
    resourceType: "lesson" | "community";
    communityId?: number;
  }) => void;
  getAccessRecords: (resourceType?: "lesson" | "community") => AccessRecord[];
  // communities
  createCommunity: (input: CreateCommunityInput) => Community;
  updateCommunity: (id: number, patch: Partial<CreateCommunityInput>) => void;
  deleteCommunity: (id: number) => void;
  joinCommunity: (id: number) => void;
  isJoined: (id: number) => boolean;
  // posts
  addPost: (input: {
    communityId: number;
    channel: string;
    title: string;
    body: string;
    category: string;
  }) => FeedPost;
  toggleLike: (postId: number) => void;
  isLiked: (postId: number) => boolean;
  // comments
  addComment: (postId: number, body: string) => Comment;
  getComments: (postId: number) => Comment[];
  // reactions
  toggleReaction: (postId: number, emoji: string) => void;
  getReactions: (postId: number) => { emoji: string; count: number; reacted: boolean }[];
  // courses
  createCourse: (input: {
    communityId: number | null;
    title: string;
    description: string;
    coverImageUrl?: string;
    thumbnail?: string;
  }) => Course;
  updateCourse: (
    idOrCourse: number | Course,
    patch?: Partial<
      Pick<
        Course,
        "title" | "description" | "communityId" | "coverImageUrl" | "thumbnail" | "published"
      >
    >,
  ) => void;
  addCourse: (course: Course) => void;
  userCommunities: Community[];
  getJoinedEmails: (communityId: number) => string[];
  publishCourse: (id: number) => void;
  unpublishCourse: (id: number) => void;
  deleteCourse: (id: number) => void;
  // modules
  addModule: (courseId: number, title: string) => CourseModule;
  updateModule: (courseId: number, moduleId: number, title: string) => void;
  deleteModule: (courseId: number, moduleId: number) => void;
  // lessons
  addLesson: (
    courseId: number,
    moduleId: number,
    input: { title: string; description?: string; videoUrl?: string },
  ) => Lesson;
  updateLesson: (
    courseId: number,
    moduleId: number,
    lessonId: number,
    patch: Partial<Pick<Lesson, "title" | "description" | "videoUrl" | "published" | "dripDays">>,
  ) => void;
  deleteLesson: (courseId: number, moduleId: number, lessonId: number) => void;
  // lesson resources
  addResourceToLesson: (
    courseId: number,
    moduleId: number,
    lessonId: number,
    input: { title: string; url: string },
  ) => LessonResource;
  removeResourceFromLesson: (
    courseId: number,
    moduleId: number,
    lessonId: number,
    resourceId: number,
  ) => void;
  // community resources
  addCommunityResource: (
    communityId: number,
    input: { title: string; url: string },
  ) => CommunityResource;
  removeCommunityResource: (id: number) => void;
  getCommunityResources: (communityId: number) => CommunityResource[];
  // community events
  addCommunityEvent: (
    communityId: number,
    input: {
      title: string;
      description?: string;
      date: string;
      time?: string;
      type: CommunityEvent["type"];
      hostPlatform?: EventHostPlatform;
      meetingUrl?: string;
      visibility?: EventVisibility;
    },
  ) => CommunityEvent;
  removeCommunityEvent: (id: number) => void;
  getCommunityEvents: (communityId: number) => CommunityEvent[];
  // enrollments
  enrollInCourse: (courseId: number) => void;
  isEnrolled: (courseId: number) => boolean;
  completeLesson: (courseId: number, lessonId: number) => void;
  isLessonComplete: (courseId: number, lessonId: number) => boolean;
  getCourseProgress: (courseId: number) => { completed: number; total: number };
  // onboarding
  onboardingCompleted: boolean;
  onboardingInterests: string[];
  completeOnboarding: (data: {
    role: "creator" | "learner";
    interests: string[];
    goals?: string[];
    skillLevel?: string;
    name?: string;
    bio?: string;
  }) => void;
  // notification preferences (synced to Supabase profiles.notification_prefs)
  notificationPrefs: Record<string, boolean>;
  updateNotificationPrefs: (prefs: Record<string, boolean>) => void;
  // notifications
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: number) => void;
  clearNotification: (id: number) => void;
  clearAllNotifications: () => void;
  pushNotification: (
    text: string,
    typeOrOpts?: NotificationType | { type?: NotificationType; link?: string; actorName?: string },
    link?: string,
    actorName?: string,
  ) => void;
  // direct messages
  directMessages: DirectMessage[];
  sendDM: (toEmail: string, body: string) => Promise<DirectMessage>;
  getConversations: () => Conversation[];
  getMessagesWithUser: (peerEmail: string) => DirectMessage[];
  markDMsRead: (fromEmail: string) => void;
  dmUnreadCount: number;
  // drip
  isLessonUnlocked: (courseId: number, lessonId: number) => boolean;
  // payment helpers
  joinPaidCommunity: (communityId: number, onError?: (msg: string) => void) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AppStoreContext = createContext<AppStoreValue | null>(null);

type ProfileResult = SessionUser & {
  onboardingCompleted: boolean;
  interests: string[];
  notificationPrefs: Record<string, boolean>;
};

async function fetchProfile(
  userId: string,
  fallbackEmail: string,
  meta: Record<string, unknown>,
): Promise<ProfileResult | null> {
  if (!supabase) return null;
  const defaultPrefs = { posts: true, dms: true, comments: true, sales: true };
  const name = (meta.name as string) || fallbackEmail.split("@")[0] || "User";
  const role: "creator" | "learner" = meta.role === "creator" ? "creator" : "learner";
  const avatar = name.slice(0, 2).toUpperCase() || "YU";

  try {
    const { data: profile, error: selectError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (selectError) {
      console.warn("[fetchProfile] Failed to fetch profile from database:", selectError);
    } else if (profile) {
      return {
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar || profile.name.slice(0, 2).toUpperCase(),
        role: profile.role,
        photoUrl: profile.photo_url || undefined,
        bio: profile.bio || undefined,
        onboardingCompleted: profile.onboarding_completed ?? false,
        interests: profile.interests ?? [],
        notificationPrefs: (profile.notification_prefs as Record<string, boolean>) ?? defaultPrefs,
      };
    }
  } catch (err) {
    console.warn("[fetchProfile] Query threw an error:", err);
  }

  // First sign-in after signup (or a project with email confirmation delay):
  // bootstrap the profile row from the auth user's metadata instead of failing.
  try {
    const { data: created, error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: userId, email: fallbackEmail, name, role, avatar })
      .select()
      .maybeSingle();

    if (upsertError) {
      console.warn("[fetchProfile] Profile upsert failed:", upsertError);
    } else if (created) {
      return {
        name: created.name,
        email: created.email,
        avatar: created.avatar,
        role: created.role,
        photoUrl: created.photo_url || undefined,
        bio: created.bio || undefined,
        onboardingCompleted: created.onboarding_completed ?? false,
        interests: created.interests ?? [],
        notificationPrefs: (created.notification_prefs as Record<string, boolean>) ?? defaultPrefs,
      };
    }
  } catch (err) {
    console.warn("[fetchProfile] Bootstrap upsert threw an error:", err);
  }

  // Extreme fallback if tables are missing or query fails: return default metadata
  return {
    name,
    email: fallbackEmail,
    avatar,
    role,
    onboardingCompleted: false,
    interests: [],
    notificationPrefs: defaultPrefs,
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDatabasePaused, setIsDatabasePaused] = useState(false);
  const bootingRef = useRef(false);
  const realtimeChannelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    function setupRealtime(email: string | undefined) {
      if (!supabase) return;
      // Clean up previous channel before creating a new one
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }

      const channel = supabase
        .channel("sukaspace-live")

        // ── INSERT events ─────────────────────────────────────────────────────
        // New posts — update the feed in real time
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "posts" },
          (payload) => {
            if (cancelled) return;
            const post = postFromRow(payload.new);
            setState((s) => {
              if (s.extraPosts.some((p) => p.id === post.id)) return s;
              return { ...s, extraPosts: [post, ...s.extraPosts] };
            });
          },
        )
        // New communities (another creator just launched one)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "communities" },
          (payload) => {
            if (cancelled) return;
            const c = communityFromRow(payload.new);
            setState((s) => {
              if (s.userCommunities.some((x) => x.id === c.id)) return s;
              return { ...s, userCommunities: [c, ...s.userCommunities] };
            });
          },
        )
        // New notifications for this user
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: email ? `user_email=eq.${email}` : undefined,
          },
          (payload) => {
            if (cancelled) return;
            const n: AppNotification = {
              id: payload.new.id,
              text: payload.new.text,
              time: payload.new.time,
              read: payload.new.read,
              type: payload.new.type ?? undefined,
              link: payload.new.link ?? undefined,
              actorName: payload.new.actor_name ?? undefined,
            };
            setState((s) => {
              // If already in state (we created it ourselves), skip — no toast
              if (s.notifications.some((x) => x.id === n.id)) return s;
              // New notification from an external source — show a toast
              setTimeout(() => {
                toast(n.text, {
                  icon:
                    n.type === "new_message"
                      ? "💬"
                      : n.type === "new_member"
                        ? "👋"
                        : n.type === "payment_success"
                          ? "✅"
                          : "🔔",
                  duration: 5000,
                  action: n.link
                    ? {
                        label: "View",
                        onClick: () => {
                          window.location.href = n.link!;
                        },
                      }
                    : undefined,
                });
              }, 0);
              return { ...s, notifications: [n, ...s.notifications] };
            });
          },
        )
        // New DMs delivered to this user
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
            filter: email ? `to_email=eq.${email}` : undefined,
          },
          (payload) => {
            if (cancelled) return;
            const dm = dmFromRow(payload.new);
            setState((s) => {
              // If already in state (we sent it ourselves), skip — no toast
              if (s.directMessages.some((x) => x.id === dm.id)) return s;
              // New DM from another user — show a toast
              setTimeout(() => {
                toast(`New message from ${dm.fromEmail}`, {
                  icon: "💬",
                  duration: 6000,
                  action: {
                    label: "Reply",
                    onClick: () => {
                      window.location.href = "/app/messages";
                    },
                  },
                });
              }, 0);
              return { ...s, directMessages: [dm, ...s.directMessages] };
            });
          },
        )

        // ── DELETE events — admin removal syncs instantly to all clients ──────
        // Community deleted from Supabase → remove everywhere in the app
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "communities" },
          (payload) => {
            if (cancelled) return;
            const deletedId = payload.old?.id as number | undefined;
            if (!deletedId) return;
            setState((s) => ({
              ...s,
              userCommunities: s.userCommunities.filter((c) => c.id !== deletedId),
              joinedCommunityIds: s.joinedCommunityIds.filter((id) => id !== deletedId),
              courses: s.courses.filter((c) => c.communityId !== deletedId),
              extraPosts: s.extraPosts.filter((p) => p.communityId !== deletedId),
              communityResources: s.communityResources.filter((r) => r.communityId !== deletedId),
              communityEvents: s.communityEvents.filter((e) => e.communityId !== deletedId),
            }));
          },
        )
        // Post deleted
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "posts" },
          (payload) => {
            if (cancelled) return;
            const deletedId = payload.old?.id as number | undefined;
            if (!deletedId) return;
            setState((s) => ({
              ...s,
              extraPosts: s.extraPosts.filter((p) => p.id !== deletedId),
              comments: s.comments.filter((c) => c.postId !== deletedId),
              likedPostIds: s.likedPostIds.filter((id) => id !== deletedId),
            }));
          },
        )
        // Course deleted
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "courses" },
          (payload) => {
            if (cancelled) return;
            const deletedId = payload.old?.id as number | undefined;
            if (!deletedId) return;
            setState((s) => ({
              ...s,
              courses: s.courses.filter((c) => c.id !== deletedId),
              enrollments: s.enrollments.filter((e) => e.courseId !== deletedId),
            }));
          },
        )
        // Notification deleted (e.g. admin clears a notification)
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: email ? `user_email=eq.${email}` : undefined,
          },
          (payload) => {
            if (cancelled) return;
            const deletedId = payload.old?.id as number | undefined;
            if (!deletedId) return;
            setState((s) => ({
              ...s,
              notifications: s.notifications.filter((n) => n.id !== deletedId),
            }));
          },
        )
        // DM deleted
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "direct_messages",
            filter: email ? `to_email=eq.${email}` : undefined,
          },
          (payload) => {
            if (cancelled) return;
            const deletedId = payload.old?.id as number | undefined;
            if (!deletedId) return;
            setState((s) => ({
              ...s,
              directMessages: s.directMessages.filter((m) => m.id !== deletedId),
            }));
          },
        )
        // Profile updated (e.g. admin changes a user's role or name)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: email ? `email=eq.${email}` : undefined,
          },
          (payload) => {
            if (cancelled || !payload.new) return;
            const r = payload.new;
            setState((s) => ({
              ...s,
              session: s.session
                ? {
                    ...s.session,
                    name: r.name ?? s.session.name,
                    role: r.role ?? s.session.role,
                    avatar: r.avatar ?? s.session.avatar,
                    photoUrl: r.photo_url ?? s.session.photoUrl,
                    bio: r.bio ?? s.session.bio,
                  }
                : s.session,
            }));
          },
        )

        .subscribe((status) => {
          if (status === "SUBSCRIBED") console.info("[SukaSpace] Realtime subscribed");
          if (status === "CHANNEL_ERROR")
            console.warn("[SukaSpace] Realtime channel error — live updates paused");
        });

      realtimeChannelRef.current = channel;
    }

    async function bootFromSupabase() {
      if (!supabase) return;
      if (bootingRef.current) return;
      bootingRef.current = true;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUser = sessionData.session?.user ?? null;
        const session = authUser?.email
          ? await fetchProfile(authUser.id, authUser.email, authUser.user_metadata || {})
          : null;
        const email = session?.email;

        const [
          communitiesRes,
          joinedRes,
          postsRes,
          likedRes,
          commentsRes,
          reactionsRes,
          coursesRes,
          resourcesRes,
          eventsRes,
          enrollmentsRes,
          accessRes,
          notificationsRes,
          dmsRes,
        ] = await Promise.all([
          supabase.from("communities").select("*"),
          email
            ? supabase.from("joined_communities").select("community_id").eq("user_email", email)
            : Promise.resolve({ data: [] as any[] }),
          supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
          email
            ? supabase.from("liked_posts").select("post_id").eq("user_email", email)
            : Promise.resolve({ data: [] as any[] }),
          supabase.from("comments").select("*"),
          supabase.from("reactions").select("*"),
          supabase.from("courses").select("*, modules(*, lessons(*, lesson_resources(*)))"),
          supabase.from("community_resources").select("*"),
          supabase.from("community_events").select("*"),
          email
            ? supabase.from("enrollments").select("*").eq("user_email", email)
            : Promise.resolve({ data: [] as any[] }),
          email
            ? supabase.from("access_records").select("*").eq("user_email", email)
            : Promise.resolve({ data: [] as any[] }),
          email
            ? supabase
                .from("notifications")
                .select("*")
                .eq("user_email", email)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] as any[] }),
          email
            ? supabase
                .from("direct_messages")
                .select("*")
                .or(`from_email.eq.${email},to_email.eq.${email}`)
                .order("created_at", { ascending: false })
                .limit(500)
            : Promise.resolve({ data: [] as any[] }),
        ]);

        if (cancelled) return;

        setState({
          session,
          accounts: [],
          userCommunities: (communitiesRes.data || []).map(communityFromRow),
          extraPosts: (postsRes.data || []).map(postFromRow),
          likedPostIds: (likedRes.data || []).map((r: any) => r.post_id),
          joinedCommunityIds: (joinedRes.data || []).map((r: any) => r.community_id),
          notifications: (notificationsRes.data || []).map((r: any): AppNotification => ({
            id: r.id,
            text: r.text,
            time: r.time,
            read: r.read,
            type: r.type ?? undefined,
            link: r.link ?? undefined,
            actorName: r.actor_name ?? undefined,
          })),
          courses: (coursesRes.data || []).map(courseFromRow),
          comments: (commentsRes.data || []).map(commentFromRow),
          reactions: (reactionsRes.data || []).map((r: any): Reaction => ({
            postId: r.post_id,
            userEmail: r.user_email,
            emoji: r.emoji,
          })),
          communityEvents: (eventsRes.data || []).map(eventFromRow),
          communityResources: (resourcesRes.data || []).map(communityResourceFromRow),
          enrollments: (enrollmentsRes.data || []).map((r: any): Enrollment => ({
            courseId: r.course_id,
            userEmail: r.user_email,
            completedLessonIds: r.completed_lesson_ids || [],
            enrolledAt: r.enrolled_at,
          })),
          accessRecords: (accessRes.data || []).map((r: any): AccessRecord => ({
            id: r.id,
            resourceId: r.resource_id,
            resourceTitle: r.resource_title,
            resourceType: r.resource_type,
            communityId: r.community_id ?? undefined,
            userEmail: r.user_email,
            accessedAt: r.accessed_at,
          })),
          directMessages: (dmsRes.data || []).map(dmFromRow),
          onboardingCompleted: (session as any)?.onboardingCompleted ?? false,
          onboardingInterests: (session as any)?.interests ?? [],
          notificationPrefs: (session as any)?.notificationPrefs ?? {
            posts: true,
            dms: true,
            comments: true,
            sales: true,
          },
        });

        // Record that database was queried successfully
        recordOrganicTraffic();
        setIsDatabasePaused(false);

        // Set up realtime subscriptions for this user
        if (!cancelled) setupRealtime(email);
      } catch (err) {
        console.error("[SukaSpace] Failed to load from Supabase:", err);
        if (isPauseError(err)) {
          setIsDatabasePaused(true);
        } else {
          setState(defaultState());
        }
      } finally {
        bootingRef.current = false;
      }
    }

    // Best-effort check connection and keep alive on mount of application
    runLegitimateHeartbeat("client").then((res) => {
      if (!res.success && isDatabasePaused === false) {
        // If query fails on mount, double check if it is paused
        setIsDatabasePaused(true);
      }
    });

    if (isSupabaseConfigured && supabase) {
      bootFromSupabase().finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
      const { data: sub } = supabase.auth.onAuthStateChange(() => {
        bootFromSupabase();
      });
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
        if (supabase && realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
      };
    }

    console.error(
      "[SukaSpace] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
    setState(defaultState());
    setIsHydrated(true);
    return () => {
      cancelled = true;
    };
  }, []);

  // All state is persisted to Supabase — no localStorage write needed.

  const communities = useMemo(
    () => [...state.userCommunities].sort((a, b) => b.createdAt - a.createdAt),
    [state.userCommunities],
  );

  const posts = useMemo(
    () => [...state.extraPosts].sort((a, b) => b.createdAt - a.createdAt),
    [state.extraPosts],
  );

  // helpers for nested course mutation
  const mutateCourse = (id: number, fn: (c: Course) => Course) => {
    setState((s) => ({ ...s, courses: s.courses.map((c) => (c.id === id ? fn(c) : c)) }));
  };
  const mutateModule = (
    courseId: number,
    moduleId: number,
    fn: (m: CourseModule) => CourseModule,
  ) => {
    mutateCourse(courseId, (c) => ({
      ...c,
      modules: c.modules.map((m) => (m.id === moduleId ? fn(m) : m)),
    }));
  };
  const mutateLesson = (
    courseId: number,
    moduleId: number,
    lessonId: number,
    fn: (l: Lesson) => Lesson,
  ) => {
    mutateModule(courseId, moduleId, (m) => ({
      ...m,
      lessons: m.lessons.map((l) => (l.id === lessonId ? fn(l) : l)),
    }));
  };

  const value: AppStoreValue = {
    session: state.session,
    communities,
    posts,
    notifications: state.notifications,
    unreadCount: state.notifications.filter((n) => !n.read).length,
    isHydrated,
    isDatabasePaused,
    joinedCommunityIds: state.joinedCommunityIds,
    courses: state.courses,
    communityResources: state.communityResources,
    communityEvents: state.communityEvents,
    enrollments: state.enrollments,
    accessRecords: state.accessRecords,
    directMessages: state.directMessages,
    dmUnreadCount: state.directMessages.filter(
      (dm) => !dm.read && dm.toEmail === state.session?.email,
    ).length,
    onboardingCompleted: state.onboardingCompleted,
    onboardingInterests: state.onboardingInterests,
    notificationPrefs: state.notificationPrefs,
    updateNotificationPrefs: (prefs) => {
      setState((s) => ({ ...s, notificationPrefs: prefs }));
      if (supabase && state.session) {
        sync(
          supabase
            .from("profiles")
            .update({ notification_prefs: prefs })
            .eq("email", state.session.email),
          "notification preferences",
        );
      }
    },
    userCommunities: communities.filter((c) => c.creatorEmail === state.session?.email),
    getJoinedEmails: (_communityId: number) => (state.session?.email ? [state.session.email] : []),
    completeOnboarding: (data) => {
      setState((s) => ({
        ...s,
        onboardingCompleted: true,
        onboardingInterests: data.interests,
        session: s.session
          ? {
              ...s.session,
              role: data.role ?? s.session.role,
              name: data.name ?? s.session.name,
              bio: data.bio ?? s.session.bio,
            }
          : s.session,
      }));
    },

    // ── auth ──
    signIn: async (email, password) => {
      if (!supabase)
        throw new Error("Authentication is unavailable. Check environment configuration.");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return "wrong_password";
      const user = await fetchProfile(
        data.user.id,
        data.user.email || email,
        data.user.user_metadata || {},
      );
      if (!user) return "not_found";
      setState((s) => ({ ...s, session: user }));
      return user;
    },
    signUp: async (name, email, password, role) => {
      if (!supabase)
        throw new Error("Authentication is unavailable. Check environment configuration.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
      if (error) {
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists")
        )
          return "email_taken";
        throw error;
      }
      if (!data.user) return "email_taken";
      const avatar = name.slice(0, 2).toUpperCase() || "YU";

      try {
        await supabase.from("profiles").upsert({ id: data.user.id, email, name, role, avatar });
      } catch (profileErr) {
        console.warn("[signUp] Profile upsert failed (will proceed):", profileErr);
      }

      if (!data.session) {
        return "verification_required";
      }

      const user: SessionUser = { name, email, avatar, role };
      setState((s) => ({
        ...s,
        session: user,
        notifications: [
          {
            id: generateId(),
            text: `Welcome to SukaSpace, ${name}!`,
            time: "Just now",
            read: false,
          },
        ],
      }));

      try {
        sync(
          supabase
            .from("notifications")
            .insert({
              id: generateId(),
              user_email: email,
              text: `Welcome to SukaSpace, ${name}!`,
              time: "Just now",
              read: false,
              created_at: Date.now(),
            }),
          "welcome notification",
        );
      } catch (notifErr) {
        console.warn("[signUp] Welcome notification insertion failed:", notifErr);
      }
      // Fire-and-forget welcome email — never blocks the sign-up flow
      sendWelcomeEmail({ data: { email, name } }).catch((err) =>
        console.warn("[email] welcome email failed:", err),
      );
      return user;
    },
    signOut: () => {
      if (supabase) supabase.auth.signOut();
      setState((s) => ({ ...s, session: null }));
    },
    getAccountRole: (email) =>
      state.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase())?.role,
    updateProfile: (patch) => {
      setState((s) => {
        const updatedSession = s.session ? { ...s.session, ...patch } : s.session;
        const updatedAccounts = s.accounts.map((a) =>
          a.email.toLowerCase() === s.session?.email.toLowerCase() ? { ...a, ...patch } : a,
        );
        return { ...s, session: updatedSession, accounts: updatedAccounts };
      });
      if (supabase && state.session) {
        sync(
          supabase
            .from("profiles")
            .update({
              ...(patch.name !== undefined ? { name: patch.name } : {}),
              ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
              ...(patch.photoUrl !== undefined ? { photo_url: patch.photoUrl } : {}),
            })
            .eq("email", state.session.email),
          "profile update",
        );
      }
    },

    // ── communities ──
    createCommunity: (input) => {
      const community: Community = {
        id: generateId(),
        title: input.title,
        category: input.category,
        members: 1,
        creator: state.session?.name || "You",
        creatorEmail: state.session?.email || "",
        avatar: state.session?.avatar || "YU",
        banner: randomBanner(),
        tag: input.tag,
        price: input.price,
        summary: input.summary,
        createdAt: Date.now(),
        color: input.color,
        coverImageUrl: input.coverImageUrl,
        iconUrl: input.iconUrl,
        isPrivate: input.isPrivate ?? false,
        discoveryKeywords: (input.discoveryKeywords ?? []).slice(0, 11),
        screeningQuestions: (input.screeningQuestions ?? []).slice(0, 3),
        welcomeMessage: input.welcomeMessage,
      };
      setState((s) => ({
        ...s,
        userCommunities: [community, ...s.userCommunities],
        joinedCommunityIds: [community.id, ...s.joinedCommunityIds],
        notifications: [
          {
            id: generateId(),
            text: `"${community.title}" is now live on Discover.`,
            time: "Just now",
            read: false,
          },
          ...s.notifications,
        ],
      }));
      if (supabase) {
        sync(supabase.from("communities").insert(communityToRow(community)), "community create");
        if (state.session?.email)
          sync(
            supabase
              .from("joined_communities")
              .insert({ community_id: community.id, user_email: state.session.email }),
            "community join",
          );
      }
      return community;
    },
    updateCommunity: (id, patch) => {
      setState((s) => ({
        ...s,
        userCommunities: s.userCommunities.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
      if (supabase) {
        const row: Record<string, any> = {};
        if (patch.title !== undefined) row.title = patch.title;
        if (patch.category !== undefined) row.category = patch.category;
        if (patch.summary !== undefined) row.summary = patch.summary;
        if (patch.tag !== undefined) row.tag = patch.tag;
        if (patch.price !== undefined) row.price = patch.price;
        if (patch.color !== undefined) row.color = patch.color;
        if (patch.coverImageUrl !== undefined) row.cover_image_url = patch.coverImageUrl;
        if (patch.iconUrl !== undefined) row.icon_url = patch.iconUrl;
        if (patch.isPrivate !== undefined) row.is_private = patch.isPrivate;
        if (patch.discoveryKeywords !== undefined) row.discovery_keywords = patch.discoveryKeywords;
        if (patch.screeningQuestions !== undefined)
          row.screening_questions = patch.screeningQuestions;
        if (patch.welcomeMessage !== undefined) row.welcome_message = patch.welcomeMessage;
        sync(supabase.from("communities").update(row).eq("id", id), "community update");
      }
    },
    deleteCommunity: (id) => {
      const courseIdsToRemove = state.courses.filter((c) => c.communityId === id).map((c) => c.id);
      setState((s) => {
        const removeSet = new Set(courseIdsToRemove);
        return {
          ...s,
          userCommunities: s.userCommunities.filter((c) => c.id !== id),
          joinedCommunityIds: s.joinedCommunityIds.filter((cid) => cid !== id),
          courses: s.courses.filter((c) => c.communityId !== id),
          enrollments: s.enrollments.filter((e) => !removeSet.has(e.courseId)),
          extraPosts: s.extraPosts.filter((p) => p.communityId !== id),
          communityResources: s.communityResources.filter((r) => r.communityId !== id),
          communityEvents: s.communityEvents.filter((e) => e.communityId !== id),
        };
      });
      if (supabase) {
        if (courseIdsToRemove.length)
          sync(
            supabase.from("courses").delete().in("id", courseIdsToRemove),
            "course cascade delete",
          );
        sync(supabase.from("communities").delete().eq("id", id), "community delete");
      }
    },
    joinCommunity: (id) => {
      setState((s) =>
        s.joinedCommunityIds.includes(id)
          ? s
          : { ...s, joinedCommunityIds: [...s.joinedCommunityIds, id] },
      );
      if (supabase && state.session?.email && !state.joinedCommunityIds.includes(id)) {
        sync(
          supabase
            .from("joined_communities")
            .insert({ community_id: id, user_email: state.session.email }),
          "community join",
        );
      }
      if (state.session && !state.joinedCommunityIds.includes(id)) {
        const community = state.userCommunities.find((c) => c.id === id);
        if (community) {
          sendCommunityJoinEmail({
            data: {
              email: state.session.email,
              name: state.session.name,
              communityTitle: community.title,
              communityTag: community.tag,
            },
          }).catch(() => {});
        }
      }
    },
    isJoined: (id) => state.joinedCommunityIds.includes(id),

    // ── posts ──
    addPost: (input) => {
      const post: FeedPost = {
        id: generateId(),
        communityId: input.communityId,
        channel: input.channel,
        author: state.session?.name || "You",
        role: state.session?.role === "creator" ? "Creator" : "Member",
        avatar: state.session?.avatar || "YU",
        title: input.title,
        category: input.category,
        likes: 0,
        comments: 0,
        body: input.body,
        createdAt: Date.now(),
      };
      setState((s) => ({ ...s, extraPosts: [post, ...s.extraPosts] }));
      if (supabase) sync(supabase.from("posts").insert(postToRow(post)), "post create");
      return post;
    },
    toggleLike: (postId) => {
      const email = state.session?.email;
      const wasLiked = state.likedPostIds.includes(postId);
      setState((s) => ({
        ...s,
        likedPostIds: wasLiked
          ? s.likedPostIds.filter((id) => id !== postId)
          : [...s.likedPostIds, postId],
      }));
      if (supabase && email) {
        sync(
          wasLiked
            ? supabase.from("liked_posts").delete().eq("post_id", postId).eq("user_email", email)
            : supabase.from("liked_posts").insert({ post_id: postId, user_email: email }),
          "post like",
        );
      }
    },
    isLiked: (postId) => state.likedPostIds.includes(postId),

    // ── comments ──
    addComment: (postId, body) => {
      const comment: Comment = {
        id: generateId(),
        postId,
        body,
        author: state.session?.name || "You",
        avatar: state.session?.avatar || "YU",
        createdAt: Date.now(),
      };
      const newCount = (state.extraPosts.find((p) => p.id === postId)?.comments ?? 0) + 1;
      setState((s) => ({
        ...s,
        comments: [...s.comments, comment],
        extraPosts: s.extraPosts.map((p) =>
          p.id === postId ? { ...p, comments: p.comments + 1 } : p,
        ),
      }));
      if (supabase) {
        sync(supabase.from("comments").insert(commentToRow(comment, postId)), "comment create");
        sync(
          supabase.from("posts").update({ comments: newCount }).eq("id", postId),
          "post comment count",
        );
      }
      return comment;
    },
    getComments: (postId) => state.comments.filter((c) => c.postId === postId),

    // ── reactions ──
    toggleReaction: (postId, emoji) => {
      const email = state.session?.email || "anon";
      const existing = state.reactions.find(
        (r) => r.postId === postId && r.userEmail === email && r.emoji === emoji,
      );
      setState((s) => ({
        ...s,
        reactions: existing
          ? s.reactions.filter(
              (r) => !(r.postId === postId && r.userEmail === email && r.emoji === emoji),
            )
          : [...s.reactions, { postId, userEmail: email, emoji }],
      }));
      if (supabase && state.session?.email) {
        sync(
          existing
            ? supabase
                .from("reactions")
                .delete()
                .eq("post_id", postId)
                .eq("user_email", email)
                .eq("emoji", emoji)
            : supabase.from("reactions").insert({ post_id: postId, user_email: email, emoji }),
          "reaction",
        );
      }
    },
    getReactions: (postId) => {
      const email = state.session?.email || "anon";
      const map = new Map<string, number>();
      state.reactions
        .filter((r) => r.postId === postId)
        .forEach((r) => map.set(r.emoji, (map.get(r.emoji) || 0) + 1));
      return Array.from(map.entries()).map(([emoji, count]) => ({
        emoji,
        count,
        reacted: state.reactions.some(
          (r) => r.postId === postId && r.userEmail === email && r.emoji === emoji,
        ),
      }));
    },

    // ── courses ──
    createCourse: (input) => {
      const course: Course = {
        id: generateId(),
        communityId: input.communityId,
        title: input.title,
        description: input.description,
        creatorEmail: state.session?.email || "",
        modules: [],
        published: false,
        enrollmentCount: 0,
        createdAt: Date.now(),
        coverImageUrl: input.coverImageUrl,
        thumbnail: input.thumbnail,
      };
      setState((s) => ({ ...s, courses: [course, ...s.courses] }));
      if (supabase) sync(supabase.from("courses").insert(courseToRow(course)), "course create");
      return course;
    },
    updateCourse: (idOrCourse, patch) => {
      const id = typeof idOrCourse === "number" ? idOrCourse : idOrCourse.id;
      const p = (typeof idOrCourse === "number" ? patch : idOrCourse) ?? {};
      mutateCourse(id, (c) => ({ ...c, ...p }));
      if (supabase) {
        const row: Record<string, unknown> = {};
        if (p.title !== undefined) row.title = p.title;
        if (p.description !== undefined) row.description = p.description;
        if (p.communityId !== undefined) row.community_id = p.communityId;
        if (p.coverImageUrl !== undefined) row.cover_image_url = p.coverImageUrl;
        if (p.thumbnail !== undefined) row.thumbnail = p.thumbnail;
        if ((p as Partial<Course>).published !== undefined)
          row.published = (p as Partial<Course>).published;
        sync(supabase.from("courses").update(row).eq("id", id), "course update");
      }
    },
    addCourse: (course) => {
      setState((s) => ({ ...s, courses: [course, ...s.courses] }));
      if (supabase) sync(supabase.from("courses").insert(courseToRow(course)), "course create");
    },
    publishCourse: (id) => {
      const course = state.courses.find((c) => c.id === id);
      setState((s) => ({
        ...s,
        courses: s.courses.map((c) => (c.id === id ? { ...c, published: true } : c)),
        notifications: course
          ? [
              {
                id: generateId(),
                text: `"${course.title}" is now published.`,
                time: "Just now",
                read: false,
              },
              ...s.notifications,
            ]
          : s.notifications,
      }));
      if (supabase)
        sync(supabase.from("courses").update({ published: true }).eq("id", id), "course publish");
    },
    unpublishCourse: (id) => {
      mutateCourse(id, (c) => ({ ...c, published: false }));
      if (supabase)
        sync(
          supabase.from("courses").update({ published: false }).eq("id", id),
          "course unpublish",
        );
    },
    deleteCourse: (id) => {
      setState((s) => ({
        ...s,
        courses: s.courses.filter((c) => c.id !== id),
        enrollments: s.enrollments.filter((e) => e.courseId !== id),
      }));
      if (supabase) sync(supabase.from("courses").delete().eq("id", id), "course delete");
    },

    // ── modules ──
    addModule: (courseId, title) => {
      const mod: CourseModule = {
        id: generateId(),
        title,
        lessons: [],
        order: (state.courses.find((c) => c.id === courseId)?.modules.length || 0) + 1,
      };
      mutateCourse(courseId, (c) => ({ ...c, modules: [...c.modules, mod] }));
      if (supabase)
        sync(
          supabase
            .from("modules")
            .insert({ id: mod.id, course_id: courseId, title: mod.title, sort_order: mod.order }),
          "module create",
        );
      return mod;
    },
    updateModule: (courseId, moduleId, title) => {
      mutateModule(courseId, moduleId, (m) => ({ ...m, title }));
      if (supabase)
        sync(supabase.from("modules").update({ title }).eq("id", moduleId), "module update");
    },
    deleteModule: (courseId, moduleId) => {
      mutateCourse(courseId, (c) => ({
        ...c,
        modules: c.modules.filter((m) => m.id !== moduleId),
      }));
      if (supabase) sync(supabase.from("modules").delete().eq("id", moduleId), "module delete");
    },

    // ── lessons ──
    addLesson: (courseId, moduleId, input) => {
      const mod = state.courses
        .find((c) => c.id === courseId)
        ?.modules.find((m) => m.id === moduleId);
      const lesson: Lesson = {
        id: generateId(),
        title: input.title,
        description: input.description || "",
        videoUrl: input.videoUrl || "",
        resources: [],
        published: false,
        order: (mod?.lessons.length || 0) + 1,
        dripDays: 0,
      };
      mutateModule(courseId, moduleId, (m) => ({ ...m, lessons: [...m.lessons, lesson] }));
      if (supabase)
        sync(
          supabase.from("lessons").insert({
            id: lesson.id,
            module_id: moduleId,
            course_id: courseId,
            title: lesson.title,
            description: lesson.description,
            video_url: lesson.videoUrl,
            published: lesson.published,
            sort_order: lesson.order,
            drip_days: 0,
          }),
          "lesson create",
        );
      return lesson;
    },
    updateLesson: (courseId, moduleId, lessonId, patch) => {
      mutateLesson(courseId, moduleId, lessonId, (l) => ({ ...l, ...patch }));
      if (supabase) {
        const row: Record<string, unknown> = {};
        if (patch.title !== undefined) row.title = patch.title;
        if (patch.description !== undefined) row.description = patch.description;
        if (patch.videoUrl !== undefined) row.video_url = patch.videoUrl;
        if (patch.published !== undefined) row.published = patch.published;
        if (patch.dripDays !== undefined) row.drip_days = patch.dripDays;
        sync(supabase.from("lessons").update(row).eq("id", lessonId), "lesson update");
      }
    },
    deleteLesson: (courseId, moduleId, lessonId) => {
      mutateModule(courseId, moduleId, (m) => ({
        ...m,
        lessons: m.lessons.filter((l) => l.id !== lessonId),
      }));
      if (supabase) sync(supabase.from("lessons").delete().eq("id", lessonId), "lesson delete");
    },

    // ── lesson resources ──
    addResourceToLesson: (courseId, moduleId, lessonId, input) => {
      const resource: LessonResource = {
        id: generateId(),
        title: input.title,
        url: input.url,
        source: detectResourceSource(input.url),
        addedAt: Date.now(),
      };
      mutateLesson(courseId, moduleId, lessonId, (l) => ({
        ...l,
        resources: [...l.resources, resource],
      }));
      if (supabase)
        sync(
          supabase.from("lesson_resources").insert({
            id: resource.id,
            lesson_id: lessonId,
            title: resource.title,
            url: resource.url,
            source: resource.source,
            added_at: resource.addedAt,
          }),
          "lesson resource create",
        );
      return resource;
    },
    removeResourceFromLesson: (courseId, moduleId, lessonId, resourceId) => {
      mutateLesson(courseId, moduleId, lessonId, (l) => ({
        ...l,
        resources: l.resources.filter((r) => r.id !== resourceId),
      }));
      if (supabase)
        sync(
          supabase.from("lesson_resources").delete().eq("id", resourceId),
          "lesson resource delete",
        );
    },

    // ── community resources ──
    addCommunityResource: (communityId, input) => {
      const resource: CommunityResource = {
        id: generateId(),
        communityId,
        title: input.title,
        url: input.url,
        source: detectResourceSource(input.url),
        addedAt: Date.now(),
      };
      setState((s) => ({ ...s, communityResources: [resource, ...s.communityResources] }));
      if (supabase)
        sync(
          supabase.from("community_resources").insert(communityResourceToRow(resource)),
          "community resource create",
        );
      return resource;
    },
    removeCommunityResource: (id) => {
      setState((s) => ({
        ...s,
        communityResources: s.communityResources.filter((r) => r.id !== id),
      }));
      if (supabase)
        sync(
          supabase.from("community_resources").delete().eq("id", id),
          "community resource delete",
        );
    },
    getCommunityResources: (communityId) =>
      state.communityResources.filter((r) => r.communityId === communityId),

    // ── community events ──
    addCommunityEvent: (communityId, input) => {
      const event: CommunityEvent = {
        id: generateId(),
        communityId,
        createdAt: Date.now(),
        hostPlatform: "native",
        visibility: "all",
        ...input,
      };

      setState((s) => ({ ...s, communityEvents: [event, ...s.communityEvents] }));
      if (supabase)
        sync(supabase.from("community_events").insert(eventToRow(event)), "community event create");
      return event;
    },
    removeCommunityEvent: (id) => {
      setState((s) => ({ ...s, communityEvents: s.communityEvents.filter((e) => e.id !== id) }));
      if (supabase)
        sync(supabase.from("community_events").delete().eq("id", id), "community event delete");
    },
    getCommunityEvents: (communityId) =>
      state.communityEvents.filter((e) => e.communityId === communityId),

    // ── enrollments ──
    enrollInCourse: (courseId) => {
      if (
        state.enrollments.find(
          (e) => e.courseId === courseId && e.userEmail === state.session?.email,
        )
      )
        return;
      const enrollment: Enrollment = {
        courseId,
        userEmail: state.session?.email || "",
        completedLessonIds: [],
        enrolledAt: Date.now(),
      };
      const newCount = (state.courses.find((c) => c.id === courseId)?.enrollmentCount ?? 0) + 1;
      setState((s) => ({
        ...s,
        enrollments: [...s.enrollments, enrollment],
        courses: s.courses.map((c) =>
          c.id === courseId ? { ...c, enrollmentCount: c.enrollmentCount + 1 } : c,
        ),
      }));
      if (supabase) {
        sync(
          supabase
            .from("enrollments")
            .insert({
              course_id: courseId,
              user_email: enrollment.userEmail,
              completed_lesson_ids: [],
              enrolled_at: enrollment.enrolledAt,
            }),
          "enrollment create",
        );
        sync(
          supabase.from("courses").update({ enrollment_count: newCount }).eq("id", courseId),
          "course enrollment count",
        );
      }
      if (state.session) {
        const course = state.courses.find((c) => c.id === courseId);
        if (course) {
          sendEnrollmentEmail({
            data: {
              email: state.session.email,
              name: state.session.name,
              courseTitle: course.title,
            },
          }).catch(() => {});
        }
      }
    },
    isEnrolled: (courseId) =>
      state.enrollments.some(
        (e) => e.courseId === courseId && e.userEmail === state.session?.email,
      ),
    completeLesson: (courseId, lessonId) => {
      const email = state.session?.email;
      const existing = state.enrollments.find(
        (e) => e.courseId === courseId && e.userEmail === email,
      );
      const nextIds = existing
        ? existing.completedLessonIds.includes(lessonId)
          ? existing.completedLessonIds
          : [...existing.completedLessonIds, lessonId]
        : [lessonId];
      setState((s) => ({
        ...s,
        enrollments: s.enrollments.map((e) =>
          e.courseId === courseId && e.userEmail === email
            ? { ...e, completedLessonIds: nextIds }
            : e,
        ),
      }));
      if (supabase && email)
        sync(
          supabase
            .from("enrollments")
            .update({ completed_lesson_ids: nextIds })
            .eq("course_id", courseId)
            .eq("user_email", email),
          "lesson completion",
        );
    },
    isLessonComplete: (courseId, lessonId) => {
      const e = state.enrollments.find(
        (e) => e.courseId === courseId && e.userEmail === state.session?.email,
      );
      return e?.completedLessonIds.includes(lessonId) || false;
    },
    getCourseProgress: (courseId) => {
      const course = state.courses.find((c) => c.id === courseId);
      const total = course?.modules.flatMap((m) => m.lessons).length || 0;
      const e = state.enrollments.find(
        (e) => e.courseId === courseId && e.userEmail === state.session?.email,
      );
      return { completed: e?.completedLessonIds.length || 0, total };
    },

    // ── access records ──
    trackResourceAccess: (input) => {
      const record: AccessRecord = {
        id: generateId(),
        resourceId: input.resourceId,
        resourceTitle: input.resourceTitle,
        resourceType: input.resourceType,
        communityId: input.communityId,
        userEmail: state.session?.email || "anon",
        accessedAt: Date.now(),
      };
      setState((s) => ({ ...s, accessRecords: [record, ...s.accessRecords] }));
      if (supabase)
        sync(
          supabase.from("access_records").insert({
            id: record.id,
            resource_id: record.resourceId,
            resource_title: record.resourceTitle,
            resource_type: record.resourceType,
            community_id: record.communityId ?? null,
            user_email: record.userEmail,
            accessed_at: record.accessedAt,
          }),
          "resource access record",
        );
    },
    getAccessRecords: (resourceType) => {
      if (!resourceType) return state.accessRecords;
      return state.accessRecords.filter((r) => r.resourceType === resourceType);
    },

    // ── notifications ──
    markAllNotificationsRead: () => {
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      }));
      if (supabase && state.session?.email)
        sync(
          supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_email", state.session.email),
          "notifications read",
        );
    },
    markNotificationRead: (id) => {
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }));
      if (supabase && state.session?.email)
        sync(
          supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", id)
            .eq("user_email", state.session.email),
          "notification read",
        );
    },
    clearNotification: (id) => {
      setState((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== id) }));
      if (supabase && state.session?.email)
        sync(
          supabase
            .from("notifications")
            .delete()
            .eq("id", id)
            .eq("user_email", state.session.email),
          "notification delete",
        );
    },
    clearAllNotifications: () => {
      setState((s) => ({ ...s, notifications: [] }));
      if (supabase && state.session?.email)
        sync(
          supabase.from("notifications").delete().eq("user_email", state.session.email),
          "notifications clear",
        );
    },
    pushNotification: (text, typeOrOpts, link, actorName) => {
      const opts =
        typeof typeOrOpts === "string"
          ? { type: typeOrOpts as NotificationType, link, actorName }
          : (typeOrOpts ?? {});
      const notification: AppNotification = {
        id: generateId(),
        text,
        time: "Just now",
        read: false,
        type: opts.type ?? "system",
        link: opts.link,
        actorName: opts.actorName,
      };
      setState((s) => ({ ...s, notifications: [notification, ...s.notifications] }));
      if (supabase && state.session?.email)
        sync(
          supabase.from("notifications").insert({
            id: notification.id,
            user_email: state.session.email,
            text,
            time: "Just now",
            read: false,
            type: notification.type,
            link: notification.link ?? null,
            actor_name: notification.actorName ?? null,
            created_at: notification.id,
          }),
          "notification create",
        );
    },

    // ── direct messages ───────────────────────────────────────────────────
    getConversations: () => {
      const email = state.session?.email;
      if (!email) return [];
      // Build a map of peer → {lastMessage, unreadCount} (messages already ordered newest-first from boot)
      const convMap = new Map<string, { lastMessage: DirectMessage; unreadCount: number }>();
      const sorted = [...state.directMessages].sort((a, b) => b.createdAt - a.createdAt);
      for (const dm of sorted) {
        const peer = dm.fromEmail === email ? dm.toEmail : dm.fromEmail;
        if (!convMap.has(peer)) convMap.set(peer, { lastMessage: dm, unreadCount: 0 });
        if (!dm.read && dm.toEmail === email) convMap.get(peer)!.unreadCount++;
      }
      return Array.from(convMap.entries()).map(([peerEmail, d]): Conversation => ({
        peerEmail,
        lastMessage: d.lastMessage,
        unreadCount: d.unreadCount,
      }));
    },
    getMessagesWithUser: (peerEmail) => {
      const email = state.session?.email;
      if (!email) return [];
      return state.directMessages
        .filter(
          (dm) =>
            (dm.fromEmail === email && dm.toEmail === peerEmail) ||
            (dm.fromEmail === peerEmail && dm.toEmail === email),
        )
        .sort((a, b) => a.createdAt - b.createdAt);
    },
    sendDM: async (toEmail, body) => {
      const dm: DirectMessage = {
        id: generateId(),
        fromEmail: state.session?.email || "",
        toEmail,
        body,
        read: false,
        createdAt: Date.now(),
      };
      setState((s) => ({ ...s, directMessages: [dm, ...s.directMessages] }));
      if (supabase) sync(supabase.from("direct_messages").insert(dmToRow(dm)), "dm send");
      return dm;
    },
    markDMsRead: (fromEmail) => {
      const email = state.session?.email;
      if (!email) return;
      setState((s) => ({
        ...s,
        directMessages: s.directMessages.map((dm) =>
          dm.fromEmail === fromEmail && dm.toEmail === email ? { ...dm, read: true } : dm,
        ),
      }));
      if (supabase && email) {
        sync(
          supabase
            .from("direct_messages")
            .update({ read: true })
            .eq("from_email", fromEmail)
            .eq("to_email", email),
          "dms read",
        );
      }
    },

    // ── drip / content gating ─────────────────────────────────────────────
    isLessonUnlocked: (courseId, lessonId) => {
      const course = state.courses.find((c) => c.id === courseId);
      const lesson = course?.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
      if (!lesson || lesson.dripDays === 0) return true;
      const enrollment = state.enrollments.find(
        (e) => e.courseId === courseId && e.userEmail === state.session?.email,
      );
      if (!enrollment) return false;
      const daysSinceEnrollment = (Date.now() - enrollment.enrolledAt) / (1000 * 60 * 60 * 24);
      return daysSinceEnrollment >= lesson.dripDays;
    },

    // ── paid community join ───────────────────────────────────────────────
    joinPaidCommunity: async (communityId, onError) => {
      const community = state.userCommunities.find((c) => c.id === communityId);
      if (!community || state.joinedCommunityIds.includes(communityId)) return;
      const session = state.session;

      // Free community or no session → join directly (no payment needed)
      if (community.tag === "FREE" || !session) {
        setState((s) =>
          s.joinedCommunityIds.includes(communityId)
            ? s
            : { ...s, joinedCommunityIds: [...s.joinedCommunityIds, communityId] },
        );
        if (supabase && session?.email) {
          sync(
            supabase
              .from("joined_communities")
              .insert({ community_id: communityId, user_email: session.email }),
            "community join",
          );
        }
        if (session) {
          sendCommunityJoinEmail({
            data: {
              email: session.email,
              name: session.name,
              communityTitle: community.title,
              communityTag: community.tag,
            },
          }).catch(() => {});
          onMemberJoin({
            data: {
              userEmail: session.email,
              userName: session.name,
              communityId,
              communityTitle: community.title,
              creatorEmail: community.creatorEmail,
              creatorName: community.creator,
              welcomeMessage: (community as any).welcomeMessage,
            },
          }).catch(() => {});
        }
        return;
      }

      // Paid community — initialize server-side transaction first, then open Paystack popup
      try {
        // Step 1: create a pending transaction server-side (amount is set server-side, not by client)
        const init = await initializePayment({
          data: {
            payerEmail: session.email,
            paymentType: "community_access",
            resourceId: communityId,
            currency: "NGN",
          },
        });

        if (!init.ok) {
          // Already has access (e.g. navigated back after payment)
          if (init.error?.includes("already have access")) {
            setState((s) =>
              s.joinedCommunityIds.includes(communityId)
                ? s
                : { ...s, joinedCommunityIds: [...s.joinedCommunityIds, communityId] },
            );
            if (supabase)
              sync(
                supabase
                  .from("joined_communities")
                  .insert({ community_id: communityId, user_email: session.email }),
                "re-join sync",
              );
            toast.success(`You already have access to ${community.title}.`);
            return;
          }
          onError?.(init.error ?? "Could not start payment. Please try again.");
          return;
        }

        const { reference, amountCents, transactionId } = init;

        // Step 2: open Paystack popup with the server-generated reference + amount
        await initiatePaystackPayment({
          email: session.email,
          amount: amountCents,
          currency: "NGN",
          reference,
          metadata: { communityId, communityTitle: community.title, transactionId },
          onSuccess: async (successRef) => {
            try {
              // Step 3: verify with Paystack + record earnings in ledger + grant access
              const verified = await verifyAndRecordPayment({
                data: { reference: successRef, transactionId, userEmail: session.email },
              });

              if (!verified.ok) {
                onError?.(verified.error ?? "Payment verification failed. Please contact support.");
                return;
              }

              // Step 4: update local state + persist join to Supabase
              setState((s) =>
                s.joinedCommunityIds.includes(communityId)
                  ? s
                  : { ...s, joinedCommunityIds: [...s.joinedCommunityIds, communityId] },
              );
              if (supabase) {
                sync(
                  supabase
                    .from("joined_communities")
                    .insert({ community_id: communityId, user_email: session.email }),
                  "paid community join",
                );
              }

              // Step 5: fire emails + welcome DM + creator notification (all best-effort)
              const displayPrice = community.price || `${(amountCents / 100).toLocaleString()} NGN`;
              Promise.allSettled([
                sendPaymentReceiptEmail({
                  data: {
                    email: session.email,
                    name: session.name,
                    communityTitle: community.title,
                    amountDisplay: displayPrice,
                    reference: successRef,
                  },
                }),
                sendCommunityJoinEmail({
                  data: {
                    email: session.email,
                    name: session.name,
                    communityTitle: community.title,
                    communityTag: "PAID",
                  },
                }),
                onMemberJoin({
                  data: {
                    userEmail: session.email,
                    userName: session.name,
                    communityId,
                    communityTitle: community.title,
                    creatorEmail: community.creatorEmail,
                    creatorName: community.creator,
                    welcomeMessage: (community as any).welcomeMessage,
                  },
                }),
              ]);

              toast.success(`Welcome to ${community.title}! Payment confirmed. ✅`);
            } catch (err: any) {
              console.error("[payment] post-payment error:", err);
              onError?.(
                err?.message ??
                  "Payment verification failed. Please contact support with your reference.",
              );
            }
          },
          onClose: () => {},
        });
      } catch (err: any) {
        console.error("[payment] Paystack initiation error:", err);
        onError?.(err?.message ?? "Payment could not be initiated. Please try again.");
      }
    },
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
