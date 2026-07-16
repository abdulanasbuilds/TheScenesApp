import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendWelcomeEmail, sendEnrollmentEmail, sendCommunityJoinEmail, sendPaymentReceiptEmail } from "@/lib/email.functions";
import { recordPayment } from "@/lib/payments.functions";
import { initiatePaystackPayment, isPaystackConfigured, priceStringToAmount } from "@/lib/paystack";
import { verifyPaystackPayment } from "@/lib/paystack.functions";

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

export type AppNotification = {
  id: number;
  text: string;
  time: string;
  read: boolean;
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

export type ResourceSource = "gdrive" | "dropbox" | "onedrive" | "notion" | "github" | "canva" | "figma" | "other";

export type LessonResource = {
  id: number;
  title: string;
  url: string;
  source: ResourceSource;
  addedAt: number;
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
};

export type CourseModule = {
  id: number;
  title: string;
  lessons: Lesson[];
  order: number;
};

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
};

export type CommunityResource = {
  id: number;
  communityId: number;
  title: string;
  url: string;
  source: ResourceSource;
  addedAt: number;
};

export type CommunityEvent = {
  id: number;
  communityId: number;
  title: string;
  date: string;
  time?: string;
  type: "session" | "deadline" | "meetup" | "personal";
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
    id: c.id, title: c.title, category: c.category, members: c.members,
    creator: c.creator, creator_email: c.creatorEmail, avatar: c.avatar,
    banner: c.banner, tag: c.tag, price: c.price ?? null, summary: c.summary,
    created_at: c.createdAt,
  };
}
function communityFromRow(r: any): Community {
  return {
    id: r.id, title: r.title, category: r.category, members: r.members,
    creator: r.creator, creatorEmail: r.creator_email, avatar: r.avatar,
    banner: r.banner, tag: r.tag, price: r.price ?? undefined, summary: r.summary,
    createdAt: r.created_at,
  };
}
function postToRow(p: FeedPost) {
  return {
    id: p.id, community_id: p.communityId, channel: p.channel, author: p.author,
    role: p.role, avatar: p.avatar, title: p.title, category: p.category,
    likes: p.likes, comments: p.comments, body: p.body, created_at: p.createdAt,
  };
}
function postFromRow(r: any): FeedPost {
  return {
    id: r.id, communityId: r.community_id, channel: r.channel, author: r.author,
    role: r.role, avatar: r.avatar, title: r.title, category: r.category,
    likes: r.likes, comments: r.comments, body: r.body, createdAt: r.created_at,
  };
}
function commentToRow(c: Comment, postId: number) {
  return { id: c.id, post_id: postId, author: c.author, avatar: c.avatar, body: c.body, created_at: c.createdAt };
}
function commentFromRow(r: any): Comment {
  return { id: r.id, postId: r.post_id, author: r.author, avatar: r.avatar, body: r.body, createdAt: r.created_at };
}
function eventToRow(e: CommunityEvent) {
  return {
    id: e.id, community_id: e.communityId, title: e.title, event_date: e.date,
    event_time: e.time ?? null, type: e.type, created_at: e.createdAt,
  };
}
function eventFromRow(r: any): CommunityEvent {
  return {
    id: r.id, communityId: r.community_id, title: r.title, date: r.event_date,
    time: r.event_time ?? undefined, type: r.type, createdAt: r.created_at,
  };
}
function communityResourceToRow(res: CommunityResource) {
  return { id: res.id, community_id: res.communityId, title: res.title, url: res.url, source: res.source, added_at: res.addedAt };
}
function communityResourceFromRow(r: any): CommunityResource {
  return { id: r.id, communityId: r.community_id, title: r.title, url: r.url, source: r.source, addedAt: r.added_at };
}
function dmToRow(dm: DirectMessage) {
  return { id: dm.id, from_email: dm.fromEmail, to_email: dm.toEmail, body: dm.body, read: dm.read, created_at: dm.createdAt };
}
function dmFromRow(r: any): DirectMessage {
  return { id: r.id, fromEmail: r.from_email, toEmail: r.to_email, body: r.body, read: r.read, createdAt: r.created_at };
}
function courseToRow(c: Course) {
  return {
    id: c.id, community_id: c.communityId, title: c.title, description: c.description,
    creator_email: c.creatorEmail, published: c.published, enrollment_count: c.enrollmentCount,
    created_at: c.createdAt,
  };
}
function courseFromRow(r: any): Course {
  const modules = (r.modules || [])
    .slice()
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((m: any): CourseModule => ({
      id: m.id, title: m.title, order: m.sort_order,
      lessons: (m.lessons || [])
        .slice()
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((l: any): Lesson => ({
          id: l.id, title: l.title, description: l.description || "", videoUrl: l.video_url || "",
          published: l.published, order: l.sort_order, dripDays: l.drip_days ?? 0,
          resources: (l.lesson_resources || []).map((res: any): LessonResource => ({
            id: res.id, title: res.title, url: res.url, source: res.source, addedAt: res.added_at,
          })),
        })),
    }));
  return {
    id: r.id, communityId: r.community_id, title: r.title, description: r.description || "",
    creatorEmail: r.creator_email || "", published: r.published, enrollmentCount: r.enrollment_count,
    createdAt: r.created_at, modules,
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
        toast.error(`Couldn't sync "${label}" to your database. It's saved on this device for now.`);
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
};

type AppStoreValue = {
  // state
  session: SessionUser | null;
  communities: Community[];
  posts: FeedPost[];
  notifications: AppNotification[];
  unreadCount: number;
  isHydrated: boolean;
  joinedCommunityIds: number[];
  courses: Course[];
  communityResources: CommunityResource[];
  communityEvents: CommunityEvent[];
  enrollments: Enrollment[];
  // auth
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (name: string, email: string, password: string, role: "creator" | "learner") => Promise<SignUpResult>;
  signOut: () => void;
  updateProfile: (patch: { name?: string; bio?: string; photoUrl?: string }) => void;
  getAccountRole: (email: string) => "creator" | "learner" | undefined;
  // access records
  accessRecords: AccessRecord[];
  trackResourceAccess: (input: { resourceId: number; resourceTitle: string; resourceType: "lesson" | "community"; communityId?: number }) => void;
  getAccessRecords: (resourceType?: "lesson" | "community") => AccessRecord[];
  // communities
  createCommunity: (input: CreateCommunityInput) => Community;
  deleteCommunity: (id: number) => void;
  joinCommunity: (id: number) => void;
  isJoined: (id: number) => boolean;
  // posts
  addPost: (input: { communityId: number; channel: string; title: string; body: string; category: string }) => FeedPost;
  toggleLike: (postId: number) => void;
  isLiked: (postId: number) => boolean;
  // comments
  addComment: (postId: number, body: string) => Comment;
  getComments: (postId: number) => Comment[];
  // reactions
  toggleReaction: (postId: number, emoji: string) => void;
  getReactions: (postId: number) => { emoji: string; count: number; reacted: boolean }[];
  // courses
  createCourse: (input: { communityId: number | null; title: string; description: string }) => Course;
  updateCourse: (id: number, patch: Partial<Pick<Course, "title" | "description" | "communityId">>) => void;
  publishCourse: (id: number) => void;
  unpublishCourse: (id: number) => void;
  deleteCourse: (id: number) => void;
  // modules
  addModule: (courseId: number, title: string) => CourseModule;
  updateModule: (courseId: number, moduleId: number, title: string) => void;
  deleteModule: (courseId: number, moduleId: number) => void;
  // lessons
  addLesson: (courseId: number, moduleId: number, input: { title: string; description?: string; videoUrl?: string }) => Lesson;
  updateLesson: (courseId: number, moduleId: number, lessonId: number, patch: Partial<Pick<Lesson, "title" | "description" | "videoUrl" | "published" | "dripDays">>) => void;
  deleteLesson: (courseId: number, moduleId: number, lessonId: number) => void;
  // lesson resources
  addResourceToLesson: (courseId: number, moduleId: number, lessonId: number, input: { title: string; url: string }) => LessonResource;
  removeResourceFromLesson: (courseId: number, moduleId: number, lessonId: number, resourceId: number) => void;
  // community resources
  addCommunityResource: (communityId: number, input: { title: string; url: string }) => CommunityResource;
  removeCommunityResource: (id: number) => void;
  getCommunityResources: (communityId: number) => CommunityResource[];
  // community events
  addCommunityEvent: (communityId: number, input: { title: string; date: string; time?: string; type: CommunityEvent["type"] }) => CommunityEvent;
  removeCommunityEvent: (id: number) => void;
  getCommunityEvents: (communityId: number) => CommunityEvent[];
  // enrollments
  enrollInCourse: (courseId: number) => void;
  isEnrolled: (courseId: number) => boolean;
  completeLesson: (courseId: number, lessonId: number) => void;
  isLessonComplete: (courseId: number, lessonId: number) => boolean;
  getCourseProgress: (courseId: number) => { completed: number; total: number };
  // notifications
  markAllNotificationsRead: () => void;
  pushNotification: (text: string) => void;
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

async function fetchProfile(userId: string, fallbackEmail: string, meta: Record<string, unknown>): Promise<SessionUser | null> {
  if (!supabase) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (profile) {
    return {
      name: profile.name, email: profile.email,
      avatar: profile.avatar || profile.name.slice(0, 2).toUpperCase(),
      role: profile.role, photoUrl: profile.photo_url || undefined, bio: profile.bio || undefined,
    };
  }
  // First sign-in after signup (or a project with email confirmation delay):
  // bootstrap the profile row from the auth user's metadata instead of failing.
  const name = (meta.name as string) || fallbackEmail.split("@")[0] || "User";
  const role: "creator" | "learner" = meta.role === "creator" ? "creator" : "learner";
  const avatar = name.slice(0, 2).toUpperCase() || "YU";
  const { data: created } = await supabase
    .from("profiles")
    .upsert({ id: userId, email: fallbackEmail, name, role, avatar })
    .select()
    .maybeSingle();
  if (!created) return { name, email: fallbackEmail, avatar, role };
  return { name: created.name, email: created.email, avatar: created.avatar, role: created.role, photoUrl: created.photo_url || undefined, bio: created.bio || undefined };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const bootingRef = useRef(false);
  const realtimeChannelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

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
        // New posts — update the feed in real time
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
          if (cancelled) return;
          const post = postFromRow(payload.new);
          setState((s) => {
            // Dedupe: don't add if we already have it (we may have inserted it ourselves)
            if (s.extraPosts.some((p) => p.id === post.id)) return s;
            return { ...s, extraPosts: [post, ...s.extraPosts] };
          });
        })
        // New notifications for this user
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: email ? `user_email=eq.${email}` : undefined },
          (payload) => {
            if (cancelled) return;
            const n: AppNotification = { id: payload.new.id, text: payload.new.text, time: payload.new.time, read: payload.new.read };
            setState((s) => {
              if (s.notifications.some((x) => x.id === n.id)) return s;
              return { ...s, notifications: [n, ...s.notifications] };
            });
          },
        )
        // New DMs delivered to this user
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages", filter: email ? `to_email=eq.${email}` : undefined },
          (payload) => {
            if (cancelled) return;
            const dm = dmFromRow(payload.new);
            setState((s) => {
              if (s.directMessages.some((x) => x.id === dm.id)) return s;
              return { ...s, directMessages: [dm, ...s.directMessages] };
            });
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") console.info("[SukaSpace] Realtime subscribed");
          if (status === "CHANNEL_ERROR") console.warn("[SukaSpace] Realtime channel error — live updates paused");
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
          communitiesRes, joinedRes, postsRes, likedRes, commentsRes, reactionsRes,
          coursesRes, resourcesRes, eventsRes, enrollmentsRes, accessRes, notificationsRes, dmsRes,
        ] = await Promise.all([
          supabase.from("communities").select("*"),
          email ? supabase.from("joined_communities").select("community_id").eq("user_email", email) : Promise.resolve({ data: [] as any[] }),
          supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
          email ? supabase.from("liked_posts").select("post_id").eq("user_email", email) : Promise.resolve({ data: [] as any[] }),
          supabase.from("comments").select("*"),
          supabase.from("reactions").select("*"),
          supabase.from("courses").select("*, modules(*, lessons(*, lesson_resources(*)))"),
          supabase.from("community_resources").select("*"),
          supabase.from("community_events").select("*"),
          email ? supabase.from("enrollments").select("*").eq("user_email", email) : Promise.resolve({ data: [] as any[] }),
          email ? supabase.from("access_records").select("*").eq("user_email", email) : Promise.resolve({ data: [] as any[] }),
          email ? supabase.from("notifications").select("*").eq("user_email", email).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
          email
            ? supabase.from("direct_messages").select("*").or(`from_email.eq.${email},to_email.eq.${email}`).order("created_at", { ascending: false }).limit(500)
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
          notifications: (notificationsRes.data || []).map((r: any): AppNotification => ({ id: r.id, text: r.text, time: r.time, read: r.read })),
          courses: (coursesRes.data || []).map(courseFromRow),
          comments: (commentsRes.data || []).map(commentFromRow),
          reactions: (reactionsRes.data || []).map((r: any): Reaction => ({ postId: r.post_id, userEmail: r.user_email, emoji: r.emoji })),
          communityEvents: (eventsRes.data || []).map(eventFromRow),
          communityResources: (resourcesRes.data || []).map(communityResourceFromRow),
          enrollments: (enrollmentsRes.data || []).map((r: any): Enrollment => ({ courseId: r.course_id, userEmail: r.user_email, completedLessonIds: r.completed_lesson_ids || [], enrolledAt: r.enrolled_at })),
          accessRecords: (accessRes.data || []).map((r: any): AccessRecord => ({ id: r.id, resourceId: r.resource_id, resourceTitle: r.resource_title, resourceType: r.resource_type, communityId: r.community_id ?? undefined, userEmail: r.user_email, accessedAt: r.accessed_at })),
          directMessages: (dmsRes.data || []).map(dmFromRow),
        });

        // Set up realtime subscriptions for this user
        if (!cancelled) setupRealtime(email);
      } catch (err) {
        console.error("[SukaSpace] Failed to load from Supabase, falling back to this device's local cache:", err);
        setState(loadState());
      } finally {
        bootingRef.current = false;
      }
    }

    if (isSupabaseConfigured && supabase) {
      bootFromSupabase().finally(() => { if (!cancelled) setIsHydrated(true); });
      const { data: sub } = supabase.auth.onAuthStateChange(() => { bootFromSupabase(); });
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
        if (supabase && realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
      };
    }

    setState(loadState());
    setIsHydrated(true);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Saving can fail if storage is full or disabled (private browsing, etc).
      // Surface it instead of silently losing the user's changes.
      console.error("Failed to save SukaSpace data to this browser:", err);
      toast.error("Couldn't save your latest changes on this device. Free up storage or try a different browser.");
    }
  }, [state, isHydrated]);

  const communities = useMemo(() =>
    [...state.userCommunities].sort((a, b) => b.createdAt - a.createdAt),
    [state.userCommunities]
  );

  const posts = useMemo(() =>
    [...state.extraPosts].sort((a, b) => b.createdAt - a.createdAt),
    [state.extraPosts]
  );

  // helpers for nested course mutation
  const mutateCourse = (id: number, fn: (c: Course) => Course) => {
    setState(s => ({ ...s, courses: s.courses.map(c => c.id === id ? fn(c) : c) }));
  };
  const mutateModule = (courseId: number, moduleId: number, fn: (m: CourseModule) => CourseModule) => {
    mutateCourse(courseId, c => ({ ...c, modules: c.modules.map(m => m.id === moduleId ? fn(m) : m) }));
  };
  const mutateLesson = (courseId: number, moduleId: number, lessonId: number, fn: (l: Lesson) => Lesson) => {
    mutateModule(courseId, moduleId, m => ({ ...m, lessons: m.lessons.map(l => l.id === lessonId ? fn(l) : l) }));
  };

  const value: AppStoreValue = {
    session: state.session,
    communities,
    posts,
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.read).length,
    isHydrated,
    joinedCommunityIds: state.joinedCommunityIds,
    courses: state.courses,
    communityResources: state.communityResources,
    communityEvents: state.communityEvents,
    enrollments: state.enrollments,
    accessRecords: state.accessRecords,
    directMessages: state.directMessages,
    dmUnreadCount: state.directMessages.filter(dm => !dm.read && dm.toEmail === state.session?.email).length,

    // ── auth ──
    signIn: async (email, password) => {
      if (!supabase) {
        const account = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
        if (!account) return "not_found";
        if (account.password !== password) return "wrong_password";
        const user: SessionUser = { name: account.name, email: account.email, avatar: account.name.slice(0, 2).toUpperCase(), role: account.role, photoUrl: account.photoUrl, bio: account.bio };
        setState(s => ({ ...s, session: user }));
        return user;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return "wrong_password";
      const user = await fetchProfile(data.user.id, data.user.email || email, data.user.user_metadata || {});
      if (!user) return "not_found";
      setState(s => ({ ...s, session: user }));
      return user;
    },
    signUp: async (name, email, password, role) => {
      if (!supabase) {
        const exists = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
        if (exists) return "email_taken";
        const user: SessionUser = { name, email, avatar: name.slice(0, 2).toUpperCase() || "YU", role };
        const account: StoredAccount = { email, name, password, role };
        setState(s => ({
          ...s,
          session: user,
          accounts: [...s.accounts, account],
          notifications: [{ id: generateId(), text: `Welcome to SukaSpace, ${name}!`, time: "Just now", read: false }],
        }));
        return user;
      }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) return "email_taken";
        throw error;
      }
      if (!data.user) return "email_taken";
      const avatar = name.slice(0, 2).toUpperCase() || "YU";
      await supabase.from("profiles").upsert({ id: data.user.id, email, name, role, avatar });
      const user: SessionUser = { name, email, avatar, role };
      setState(s => ({
        ...s,
        session: user,
        notifications: [{ id: generateId(), text: `Welcome to SukaSpace, ${name}!`, time: "Just now", read: false }],
      }));
      sync(supabase.from("notifications").insert({ id: generateId(), user_email: email, text: `Welcome to SukaSpace, ${name}!`, time: "Just now", read: false, created_at: Date.now() }), "welcome notification");
      // Fire-and-forget welcome email — never blocks the sign-up flow
      sendWelcomeEmail({ data: { email, name } }).catch((err) => console.warn("[email] welcome email failed:", err));
      return user;
    },
    signOut: () => {
      if (supabase) supabase.auth.signOut();
      setState(s => ({ ...s, session: null }));
    },
    getAccountRole: (email) => state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase())?.role,
    updateProfile: (patch) => {
      setState(s => {
        const updatedSession = s.session ? { ...s.session, ...patch } : s.session;
        const updatedAccounts = s.accounts.map(a =>
          a.email.toLowerCase() === s.session?.email.toLowerCase() ? { ...a, ...patch } : a
        );
        return { ...s, session: updatedSession, accounts: updatedAccounts };
      });
      if (supabase && state.session) {
        sync(supabase.from("profiles").update({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
          ...(patch.photoUrl !== undefined ? { photo_url: patch.photoUrl } : {}),
        }).eq("email", state.session.email), "profile update");
      }
    },

    // ── communities ──
    createCommunity: (input) => {
      const community: Community = {
        id: generateId(), title: input.title, category: input.category,
        members: 1, creator: state.session?.name || "You",
        creatorEmail: state.session?.email || "",
        avatar: state.session?.avatar || "YU", banner: randomBanner(),
        tag: input.tag, price: input.price, summary: input.summary, createdAt: Date.now(),
      };
      setState(s => ({
        ...s,
        userCommunities: [community, ...s.userCommunities],
        joinedCommunityIds: [community.id, ...s.joinedCommunityIds],
        notifications: [{ id: generateId(), text: `"${community.title}" is now live on Discover.`, time: "Just now", read: false }, ...s.notifications],
      }));
      if (supabase) {
        sync(supabase.from("communities").insert(communityToRow(community)), "community create");
        if (state.session?.email) sync(supabase.from("joined_communities").insert({ community_id: community.id, user_email: state.session.email }), "community join");
      }
      return community;
    },
    deleteCommunity: (id) => {
      const courseIdsToRemove = state.courses.filter(c => c.communityId === id).map(c => c.id);
      setState(s => {
        const removeSet = new Set(courseIdsToRemove);
        return {
          ...s,
          userCommunities: s.userCommunities.filter(c => c.id !== id),
          joinedCommunityIds: s.joinedCommunityIds.filter(cid => cid !== id),
          courses: s.courses.filter(c => c.communityId !== id),
          enrollments: s.enrollments.filter(e => !removeSet.has(e.courseId)),
          extraPosts: s.extraPosts.filter(p => p.communityId !== id),
          communityResources: s.communityResources.filter(r => r.communityId !== id),
          communityEvents: s.communityEvents.filter(e => e.communityId !== id),
        };
      });
      if (supabase) {
        if (courseIdsToRemove.length) sync(supabase.from("courses").delete().in("id", courseIdsToRemove), "course cascade delete");
        sync(supabase.from("communities").delete().eq("id", id), "community delete");
      }
    },
    joinCommunity: (id) => {
      setState(s => s.joinedCommunityIds.includes(id) ? s : { ...s, joinedCommunityIds: [...s.joinedCommunityIds, id] });
      if (supabase && state.session?.email && !state.joinedCommunityIds.includes(id)) {
        sync(supabase.from("joined_communities").insert({ community_id: id, user_email: state.session.email }), "community join");
      }
      if (state.session && !state.joinedCommunityIds.includes(id)) {
        const community = state.userCommunities.find(c => c.id === id);
        if (community) {
          sendCommunityJoinEmail({ data: { email: state.session.email, name: state.session.name, communityTitle: community.title, communityTag: community.tag } }).catch(() => {});
        }
      }
    },
    isJoined: (id) => state.joinedCommunityIds.includes(id),

    // ── posts ──
    addPost: (input) => {
      const post: FeedPost = {
        id: generateId(), communityId: input.communityId, channel: input.channel,
        author: state.session?.name || "You", role: state.session?.role === "creator" ? "Creator" : "Member",
        avatar: state.session?.avatar || "YU", title: input.title, category: input.category,
        likes: 0, comments: 0, body: input.body, createdAt: Date.now(),
      };
      setState(s => ({ ...s, extraPosts: [post, ...s.extraPosts] }));
      if (supabase) sync(supabase.from("posts").insert(postToRow(post)), "post create");
      return post;
    },
    toggleLike: (postId) => {
      const email = state.session?.email;
      const wasLiked = state.likedPostIds.includes(postId);
      setState(s => ({
        ...s,
        likedPostIds: wasLiked
          ? s.likedPostIds.filter(id => id !== postId)
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
        id: generateId(), postId, body,
        author: state.session?.name || "You",
        avatar: state.session?.avatar || "YU",
        createdAt: Date.now(),
      };
      const newCount = (state.extraPosts.find(p => p.id === postId)?.comments ?? 0) + 1;
      setState(s => ({
        ...s,
        comments: [...s.comments, comment],
        extraPosts: s.extraPosts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p),
      }));
      if (supabase) {
        sync(supabase.from("comments").insert(commentToRow(comment, postId)), "comment create");
        sync(supabase.from("posts").update({ comments: newCount }).eq("id", postId), "post comment count");
      }
      return comment;
    },
    getComments: (postId) => state.comments.filter(c => c.postId === postId),

    // ── reactions ──
    toggleReaction: (postId, emoji) => {
      const email = state.session?.email || "anon";
      const existing = state.reactions.find(r => r.postId === postId && r.userEmail === email && r.emoji === emoji);
      setState(s => ({
        ...s,
        reactions: existing
          ? s.reactions.filter(r => !(r.postId === postId && r.userEmail === email && r.emoji === emoji))
          : [...s.reactions, { postId, userEmail: email, emoji }],
      }));
      if (supabase && state.session?.email) {
        sync(
          existing
            ? supabase.from("reactions").delete().eq("post_id", postId).eq("user_email", email).eq("emoji", emoji)
            : supabase.from("reactions").insert({ post_id: postId, user_email: email, emoji }),
          "reaction",
        );
      }
    },
    getReactions: (postId) => {
      const email = state.session?.email || "anon";
      const map = new Map<string, number>();
      state.reactions.filter(r => r.postId === postId).forEach(r => map.set(r.emoji, (map.get(r.emoji) || 0) + 1));
      return Array.from(map.entries()).map(([emoji, count]) => ({
        emoji, count,
        reacted: state.reactions.some(r => r.postId === postId && r.userEmail === email && r.emoji === emoji),
      }));
    },

    // ── courses ──
    createCourse: (input) => {
      const course: Course = {
        id: generateId(), communityId: input.communityId,
        title: input.title, description: input.description,
        creatorEmail: state.session?.email || "",
        modules: [], published: false, enrollmentCount: 0, createdAt: Date.now(),
      };
      setState(s => ({ ...s, courses: [course, ...s.courses] }));
      if (supabase) sync(supabase.from("courses").insert(courseToRow(course)), "course create");
      return course;
    },
    updateCourse: (id, patch) => {
      mutateCourse(id, c => ({ ...c, ...patch }));
      if (supabase) {
        const row: Record<string, unknown> = {};
        if (patch.title !== undefined) row.title = patch.title;
        if (patch.description !== undefined) row.description = patch.description;
        if (patch.communityId !== undefined) row.community_id = patch.communityId;
        sync(supabase.from("courses").update(row).eq("id", id), "course update");
      }
    },
    publishCourse: (id) => {
      const course = state.courses.find(c => c.id === id);
      setState(s => ({
        ...s,
        courses: s.courses.map(c => c.id === id ? { ...c, published: true } : c),
        notifications: course ? [{ id: generateId(), text: `"${course.title}" is now published.`, time: "Just now", read: false }, ...s.notifications] : s.notifications,
      }));
      if (supabase) sync(supabase.from("courses").update({ published: true }).eq("id", id), "course publish");
    },
    unpublishCourse: (id) => {
      mutateCourse(id, c => ({ ...c, published: false }));
      if (supabase) sync(supabase.from("courses").update({ published: false }).eq("id", id), "course unpublish");
    },
    deleteCourse: (id) => {
      setState(s => ({
        ...s,
        courses: s.courses.filter(c => c.id !== id),
        enrollments: s.enrollments.filter(e => e.courseId !== id),
      }));
      if (supabase) sync(supabase.from("courses").delete().eq("id", id), "course delete");
    },

    // ── modules ──
    addModule: (courseId, title) => {
      const mod: CourseModule = {
        id: generateId(), title, lessons: [],
        order: (state.courses.find(c => c.id === courseId)?.modules.length || 0) + 1,
      };
      mutateCourse(courseId, c => ({ ...c, modules: [...c.modules, mod] }));
      if (supabase) sync(supabase.from("modules").insert({ id: mod.id, course_id: courseId, title: mod.title, sort_order: mod.order }), "module create");
      return mod;
    },
    updateModule: (courseId, moduleId, title) => {
      mutateModule(courseId, moduleId, m => ({ ...m, title }));
      if (supabase) sync(supabase.from("modules").update({ title }).eq("id", moduleId), "module update");
    },
    deleteModule: (courseId, moduleId) => {
      mutateCourse(courseId, c => ({ ...c, modules: c.modules.filter(m => m.id !== moduleId) }));
      if (supabase) sync(supabase.from("modules").delete().eq("id", moduleId), "module delete");
    },

    // ── lessons ──
    addLesson: (courseId, moduleId, input) => {
      const mod = state.courses.find(c => c.id === courseId)?.modules.find(m => m.id === moduleId);
      const lesson: Lesson = {
        id: generateId(), title: input.title, description: input.description || "",
        videoUrl: input.videoUrl || "", resources: [], published: false,
        order: (mod?.lessons.length || 0) + 1, dripDays: 0,
      };
      mutateModule(courseId, moduleId, m => ({ ...m, lessons: [...m.lessons, lesson] }));
      if (supabase) sync(supabase.from("lessons").insert({
        id: lesson.id, module_id: moduleId, course_id: courseId, title: lesson.title,
        description: lesson.description, video_url: lesson.videoUrl, published: lesson.published, sort_order: lesson.order, drip_days: 0,
      }), "lesson create");
      return lesson;
    },
    updateLesson: (courseId, moduleId, lessonId, patch) => {
      mutateLesson(courseId, moduleId, lessonId, l => ({ ...l, ...patch }));
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
      mutateModule(courseId, moduleId, m => ({ ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }));
      if (supabase) sync(supabase.from("lessons").delete().eq("id", lessonId), "lesson delete");
    },

    // ── lesson resources ──
    addResourceToLesson: (courseId, moduleId, lessonId, input) => {
      const resource: LessonResource = {
        id: generateId(), title: input.title, url: input.url,
        source: detectResourceSource(input.url), addedAt: Date.now(),
      };
      mutateLesson(courseId, moduleId, lessonId, l => ({ ...l, resources: [...l.resources, resource] }));
      if (supabase) sync(supabase.from("lesson_resources").insert({
        id: resource.id, lesson_id: lessonId, title: resource.title, url: resource.url, source: resource.source, added_at: resource.addedAt,
      }), "lesson resource create");
      return resource;
    },
    removeResourceFromLesson: (courseId, moduleId, lessonId, resourceId) => {
      mutateLesson(courseId, moduleId, lessonId, l => ({ ...l, resources: l.resources.filter(r => r.id !== resourceId) }));
      if (supabase) sync(supabase.from("lesson_resources").delete().eq("id", resourceId), "lesson resource delete");
    },

    // ── community resources ──
    addCommunityResource: (communityId, input) => {
      const resource: CommunityResource = {
        id: generateId(), communityId, title: input.title, url: input.url,
        source: detectResourceSource(input.url), addedAt: Date.now(),
      };
      setState(s => ({ ...s, communityResources: [resource, ...s.communityResources] }));
      if (supabase) sync(supabase.from("community_resources").insert(communityResourceToRow(resource)), "community resource create");
      return resource;
    },
    removeCommunityResource: (id) => {
      setState(s => ({ ...s, communityResources: s.communityResources.filter(r => r.id !== id) }));
      if (supabase) sync(supabase.from("community_resources").delete().eq("id", id), "community resource delete");
    },
    getCommunityResources: (communityId) => state.communityResources.filter(r => r.communityId === communityId),

    // ── community events ──
    addCommunityEvent: (communityId, input) => {
      const event: CommunityEvent = { id: generateId(), communityId, ...input, createdAt: Date.now() };
      setState(s => ({ ...s, communityEvents: [event, ...s.communityEvents] }));
      if (supabase) sync(supabase.from("community_events").insert(eventToRow(event)), "community event create");
      return event;
    },
    removeCommunityEvent: (id) => {
      setState(s => ({ ...s, communityEvents: s.communityEvents.filter(e => e.id !== id) }));
      if (supabase) sync(supabase.from("community_events").delete().eq("id", id), "community event delete");
    },
    getCommunityEvents: (communityId) => state.communityEvents.filter(e => e.communityId === communityId),

    // ── enrollments ──
    enrollInCourse: (courseId) => {
      if (state.enrollments.find(e => e.courseId === courseId && e.userEmail === state.session?.email)) return;
      const enrollment: Enrollment = { courseId, userEmail: state.session?.email || "", completedLessonIds: [], enrolledAt: Date.now() };
      const newCount = (state.courses.find(c => c.id === courseId)?.enrollmentCount ?? 0) + 1;
      setState(s => ({
        ...s,
        enrollments: [...s.enrollments, enrollment],
        courses: s.courses.map(c => c.id === courseId ? { ...c, enrollmentCount: c.enrollmentCount + 1 } : c),
      }));
      if (supabase) {
        sync(supabase.from("enrollments").insert({ course_id: courseId, user_email: enrollment.userEmail, completed_lesson_ids: [], enrolled_at: enrollment.enrolledAt }), "enrollment create");
        sync(supabase.from("courses").update({ enrollment_count: newCount }).eq("id", courseId), "course enrollment count");
      }
      if (state.session) {
        const course = state.courses.find(c => c.id === courseId);
        if (course) {
          sendEnrollmentEmail({ data: { email: state.session.email, name: state.session.name, courseTitle: course.title } }).catch(() => {});
        }
      }
    },
    isEnrolled: (courseId) => state.enrollments.some(e => e.courseId === courseId && e.userEmail === state.session?.email),
    completeLesson: (courseId, lessonId) => {
      const email = state.session?.email;
      const existing = state.enrollments.find(e => e.courseId === courseId && e.userEmail === email);
      const nextIds = existing ? (existing.completedLessonIds.includes(lessonId) ? existing.completedLessonIds : [...existing.completedLessonIds, lessonId]) : [lessonId];
      setState(s => ({
        ...s,
        enrollments: s.enrollments.map(e =>
          e.courseId === courseId && e.userEmail === email
            ? { ...e, completedLessonIds: nextIds }
            : e
        ),
      }));
      if (supabase && email) sync(supabase.from("enrollments").update({ completed_lesson_ids: nextIds }).eq("course_id", courseId).eq("user_email", email), "lesson completion");
    },
    isLessonComplete: (courseId, lessonId) => {
      const e = state.enrollments.find(e => e.courseId === courseId && e.userEmail === state.session?.email);
      return e?.completedLessonIds.includes(lessonId) || false;
    },
    getCourseProgress: (courseId) => {
      const course = state.courses.find(c => c.id === courseId);
      const total = course?.modules.flatMap(m => m.lessons).length || 0;
      const e = state.enrollments.find(e => e.courseId === courseId && e.userEmail === state.session?.email);
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
      setState(s => ({ ...s, accessRecords: [record, ...s.accessRecords] }));
      if (supabase) sync(supabase.from("access_records").insert({
        id: record.id, resource_id: record.resourceId, resource_title: record.resourceTitle,
        resource_type: record.resourceType, community_id: record.communityId ?? null,
        user_email: record.userEmail, accessed_at: record.accessedAt,
      }), "resource access record");
    },
    getAccessRecords: (resourceType) => {
      if (!resourceType) return state.accessRecords;
      return state.accessRecords.filter(r => r.resourceType === resourceType);
    },

    // ── notifications ──
    markAllNotificationsRead: () => {
      setState(s => ({ ...s, notifications: s.notifications.map(n => ({ ...n, read: true })) }));
      if (supabase && state.session?.email) sync(supabase.from("notifications").update({ read: true }).eq("user_email", state.session.email), "notifications read");
    },
    pushNotification: (text) => {
      const notification: AppNotification = { id: generateId(), text, time: "Just now", read: false };
      setState(s => ({ ...s, notifications: [notification, ...s.notifications] }));
      if (supabase && state.session?.email) sync(supabase.from("notifications").insert({
        id: notification.id, user_email: state.session.email, text, time: "Just now", read: false, created_at: notification.id,
      }), "notification create");
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
        .filter(dm => (dm.fromEmail === email && dm.toEmail === peerEmail) || (dm.fromEmail === peerEmail && dm.toEmail === email))
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
      setState(s => ({ ...s, directMessages: [dm, ...s.directMessages] }));
      if (supabase) sync(supabase.from("direct_messages").insert(dmToRow(dm)), "dm send");
      return dm;
    },
    markDMsRead: (fromEmail) => {
      const email = state.session?.email;
      if (!email) return;
      setState(s => ({
        ...s,
        directMessages: s.directMessages.map(dm =>
          dm.fromEmail === fromEmail && dm.toEmail === email ? { ...dm, read: true } : dm,
        ),
      }));
      if (supabase && email) {
        sync(supabase.from("direct_messages").update({ read: true }).eq("from_email", fromEmail).eq("to_email", email), "dms read");
      }
    },

    // ── drip / content gating ─────────────────────────────────────────────
    isLessonUnlocked: (courseId, lessonId) => {
      const course = state.courses.find(c => c.id === courseId);
      const lesson = course?.modules.flatMap(m => m.lessons).find(l => l.id === lessonId);
      if (!lesson || lesson.dripDays === 0) return true;
      const enrollment = state.enrollments.find(
        e => e.courseId === courseId && e.userEmail === state.session?.email,
      );
      if (!enrollment) return false;
      const daysSinceEnrollment = (Date.now() - enrollment.enrolledAt) / (1000 * 60 * 60 * 24);
      return daysSinceEnrollment >= lesson.dripDays;
    },

    // ── paid community join ───────────────────────────────────────────────
    joinPaidCommunity: async (communityId, onError) => {
      const community = state.userCommunities.find(c => c.id === communityId);
      if (!community || state.joinedCommunityIds.includes(communityId)) return;
      const session = state.session;

      // Free community or Paystack not configured → join directly
      if (community.tag === "FREE" || !isPaystackConfigured() || !session) {
        setState(s => s.joinedCommunityIds.includes(communityId) ? s : { ...s, joinedCommunityIds: [...s.joinedCommunityIds, communityId] });
        if (supabase && session?.email) {
          sync(supabase.from("joined_communities").insert({ community_id: communityId, user_email: session.email }), "community join");
        }
        if (session) {
          sendCommunityJoinEmail({ data: { email: session.email, name: session.name, communityTitle: community.title, communityTag: community.tag } }).catch(() => {});
        }
        return;
      }

      // Paid community — open Paystack popup
      const amount = priceStringToAmount(community.price || "0", "NGN");
      try {
        await initiatePaystackPayment({
          email: session.email,
          amount,
          currency: "NGN",
          metadata: { communityId, communityTitle: community.title },
          onSuccess: async (reference) => {
            try {
              await verifyPaystackPayment({ data: { reference, communityId, expectedEmail: session.email } });
              await recordPayment({
                data: {
                  id: generateId(),
                  communityId,
                  fromEmail: session.email,
                  toEmail: community.creatorEmail,
                  reference,
                  amountCents: amount,
                  currency: "NGN",
                },
              });
              setState(s => s.joinedCommunityIds.includes(communityId) ? s : { ...s, joinedCommunityIds: [...s.joinedCommunityIds, communityId] });
              if (supabase) {
                sync(supabase.from("joined_communities").insert({ community_id: communityId, user_email: session.email }), "paid community join");
              }
              sendPaymentReceiptEmail({
                data: {
                  email: session.email,
                  name: session.name,
                  communityTitle: community.title,
                  amountDisplay: community.price || `${(amount / 100).toLocaleString()} NGN`,
                  reference,
                },
              }).catch(() => {});
              sendCommunityJoinEmail({ data: { email: session.email, name: session.name, communityTitle: community.title, communityTag: "PAID" } }).catch(() => {});
              toast.success(`Welcome to ${community.title}! Payment confirmed.`);
            } catch (err: any) {
              console.error("[payment] post-payment error:", err);
              onError?.(err?.message ?? "Payment verification failed. Please contact support with your reference.");
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
