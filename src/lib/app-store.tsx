import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// ─── Core Types ──────────────────────────────────────────────────────────────

export type Community = {
  id: number;
  title: string;
  category: string;
  members: number;
  creator: string;
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
  signIn: (email: string, password: string) => SignInResult;
  signUp: (name: string, email: string, password: string, role: "creator" | "learner") => SignUpResult;
  signOut: () => void;
  updateProfile: (patch: { name?: string; bio?: string; photoUrl?: string }) => void;
  // access records
  accessRecords: AccessRecord[];
  trackResourceAccess: (input: { resourceId: number; resourceTitle: string; resourceType: "lesson" | "community"; communityId?: number }) => void;
  getAccessRecords: (resourceType?: "lesson" | "community") => AccessRecord[];
  // communities
  createCommunity: (input: CreateCommunityInput) => Community;
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
  updateLesson: (courseId: number, moduleId: number, lessonId: number, patch: Partial<Pick<Lesson, "title" | "description" | "videoUrl" | "published">>) => void;
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
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
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

    // ── auth ──
    signIn: (email, password) => {
      const account = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (!account) return "not_found";
      if (account.password !== password) return "wrong_password";
      const user: SessionUser = { name: account.name, email: account.email, avatar: account.name.slice(0, 2).toUpperCase(), role: account.role, photoUrl: account.photoUrl, bio: account.bio };
      setState(s => ({ ...s, session: user }));
      return user;
    },
    signUp: (name, email, password, role) => {
      const exists = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (exists) return "email_taken";
      const user: SessionUser = { name, email, avatar: name.slice(0, 2).toUpperCase() || "YU", role };
      const account: StoredAccount = { email, name, password, role };
      setState(s => ({
        ...s,
        session: user,
        accounts: [...s.accounts, account],
        notifications: [{ id: Date.now(), text: `Welcome to SukaSpace, ${name}!`, time: "Just now", read: false }],
      }));
      return user;
    },
    signOut: () => setState(s => ({ ...s, session: null })),
    updateProfile: (patch) => {
      setState(s => {
        const updatedSession = s.session ? { ...s.session, ...patch } : s.session;
        const updatedAccounts = s.accounts.map(a =>
          a.email.toLowerCase() === s.session?.email.toLowerCase() ? { ...a, ...patch } : a
        );
        return { ...s, session: updatedSession, accounts: updatedAccounts };
      });
    },

    // ── communities ──
    createCommunity: (input) => {
      const community: Community = {
        id: Date.now(), title: input.title, category: input.category,
        members: 1, creator: state.session?.name || "You",
        avatar: state.session?.avatar || "YU", banner: randomBanner(),
        tag: input.tag, price: input.price, summary: input.summary, createdAt: Date.now(),
      };
      setState(s => ({
        ...s,
        userCommunities: [community, ...s.userCommunities],
        joinedCommunityIds: [community.id, ...s.joinedCommunityIds],
        notifications: [{ id: Date.now(), text: `"${community.title}" is now live on Discover.`, time: "Just now", read: false }, ...s.notifications],
      }));
      return community;
    },
    joinCommunity: (id) => setState(s => s.joinedCommunityIds.includes(id) ? s : { ...s, joinedCommunityIds: [...s.joinedCommunityIds, id] }),
    isJoined: (id) => state.joinedCommunityIds.includes(id),

    // ── posts ──
    addPost: (input) => {
      const post: FeedPost = {
        id: Date.now(), communityId: input.communityId, channel: input.channel,
        author: state.session?.name || "You", role: state.session?.role === "creator" ? "Creator" : "Member",
        avatar: state.session?.avatar || "YU", title: input.title, category: input.category,
        likes: 0, comments: 0, body: input.body, createdAt: Date.now(),
      };
      setState(s => ({ ...s, extraPosts: [post, ...s.extraPosts] }));
      return post;
    },
    toggleLike: (postId) => setState(s => ({
      ...s,
      likedPostIds: s.likedPostIds.includes(postId)
        ? s.likedPostIds.filter(id => id !== postId)
        : [...s.likedPostIds, postId],
    })),
    isLiked: (postId) => state.likedPostIds.includes(postId),

    // ── comments ──
    addComment: (postId, body) => {
      const comment: Comment = {
        id: Date.now(), postId, body,
        author: state.session?.name || "You",
        avatar: state.session?.avatar || "YU",
        createdAt: Date.now(),
      };
      setState(s => ({
        ...s,
        comments: [...s.comments, comment],
        extraPosts: s.extraPosts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p),
      }));
      return comment;
    },
    getComments: (postId) => state.comments.filter(c => c.postId === postId),

    // ── reactions ──
    toggleReaction: (postId, emoji) => {
      const email = state.session?.email || "anon";
      setState(s => {
        const existing = s.reactions.find(r => r.postId === postId && r.userEmail === email && r.emoji === emoji);
        return {
          ...s,
          reactions: existing
            ? s.reactions.filter(r => !(r.postId === postId && r.userEmail === email && r.emoji === emoji))
            : [...s.reactions, { postId, userEmail: email, emoji }],
        };
      });
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
        id: Date.now(), communityId: input.communityId,
        title: input.title, description: input.description,
        creatorEmail: state.session?.email || "",
        modules: [], published: false, enrollmentCount: 0, createdAt: Date.now(),
      };
      setState(s => ({ ...s, courses: [course, ...s.courses] }));
      return course;
    },
    updateCourse: (id, patch) => mutateCourse(id, c => ({ ...c, ...patch })),
    publishCourse: (id) => {
      mutateCourse(id, c => ({ ...c, published: true }));
      const course = state.courses.find(c => c.id === id);
      if (course) setState(s => ({
        ...s,
        courses: s.courses.map(c => c.id === id ? { ...c, published: true } : c),
        notifications: [{ id: Date.now(), text: `"${course.title}" is now published.`, time: "Just now", read: false }, ...s.notifications],
      }));
    },
    unpublishCourse: (id) => mutateCourse(id, c => ({ ...c, published: false })),
    deleteCourse: (id) => setState(s => ({ ...s, courses: s.courses.filter(c => c.id !== id) })),

    // ── modules ──
    addModule: (courseId, title) => {
      const mod: CourseModule = {
        id: Date.now(), title, lessons: [],
        order: (state.courses.find(c => c.id === courseId)?.modules.length || 0) + 1,
      };
      mutateCourse(courseId, c => ({ ...c, modules: [...c.modules, mod] }));
      return mod;
    },
    updateModule: (courseId, moduleId, title) => mutateModule(courseId, moduleId, m => ({ ...m, title })),
    deleteModule: (courseId, moduleId) => mutateCourse(courseId, c => ({ ...c, modules: c.modules.filter(m => m.id !== moduleId) })),

    // ── lessons ──
    addLesson: (courseId, moduleId, input) => {
      const mod = state.courses.find(c => c.id === courseId)?.modules.find(m => m.id === moduleId);
      const lesson: Lesson = {
        id: Date.now(), title: input.title, description: input.description || "",
        videoUrl: input.videoUrl || "", resources: [], published: false,
        order: (mod?.lessons.length || 0) + 1,
      };
      mutateModule(courseId, moduleId, m => ({ ...m, lessons: [...m.lessons, lesson] }));
      return lesson;
    },
    updateLesson: (courseId, moduleId, lessonId, patch) => mutateLesson(courseId, moduleId, lessonId, l => ({ ...l, ...patch })),
    deleteLesson: (courseId, moduleId, lessonId) => mutateModule(courseId, moduleId, m => ({ ...m, lessons: m.lessons.filter(l => l.id !== lessonId) })),

    // ── lesson resources ──
    addResourceToLesson: (courseId, moduleId, lessonId, input) => {
      const resource: LessonResource = {
        id: Date.now(), title: input.title, url: input.url,
        source: detectResourceSource(input.url), addedAt: Date.now(),
      };
      mutateLesson(courseId, moduleId, lessonId, l => ({ ...l, resources: [...l.resources, resource] }));
      return resource;
    },
    removeResourceFromLesson: (courseId, moduleId, lessonId, resourceId) =>
      mutateLesson(courseId, moduleId, lessonId, l => ({ ...l, resources: l.resources.filter(r => r.id !== resourceId) })),

    // ── community resources ──
    addCommunityResource: (communityId, input) => {
      const resource: CommunityResource = {
        id: Date.now(), communityId, title: input.title, url: input.url,
        source: detectResourceSource(input.url), addedAt: Date.now(),
      };
      setState(s => ({ ...s, communityResources: [resource, ...s.communityResources] }));
      return resource;
    },
    removeCommunityResource: (id) => setState(s => ({ ...s, communityResources: s.communityResources.filter(r => r.id !== id) })),
    getCommunityResources: (communityId) => state.communityResources.filter(r => r.communityId === communityId),

    // ── community events ──
    addCommunityEvent: (communityId, input) => {
      const event: CommunityEvent = { id: Date.now(), communityId, ...input, createdAt: Date.now() };
      setState(s => ({ ...s, communityEvents: [event, ...s.communityEvents] }));
      return event;
    },
    removeCommunityEvent: (id) => setState(s => ({ ...s, communityEvents: s.communityEvents.filter(e => e.id !== id) })),
    getCommunityEvents: (communityId) => state.communityEvents.filter(e => e.communityId === communityId),

    // ── enrollments ──
    enrollInCourse: (courseId) => {
      if (state.enrollments.find(e => e.courseId === courseId && e.userEmail === state.session?.email)) return;
      const enrollment: Enrollment = { courseId, userEmail: state.session?.email || "", completedLessonIds: [], enrolledAt: Date.now() };
      setState(s => ({
        ...s,
        enrollments: [...s.enrollments, enrollment],
        courses: s.courses.map(c => c.id === courseId ? { ...c, enrollmentCount: c.enrollmentCount + 1 } : c),
      }));
    },
    isEnrolled: (courseId) => state.enrollments.some(e => e.courseId === courseId && e.userEmail === state.session?.email),
    completeLesson: (courseId, lessonId) => {
      setState(s => ({
        ...s,
        enrollments: s.enrollments.map(e =>
          e.courseId === courseId && e.userEmail === state.session?.email
            ? { ...e, completedLessonIds: e.completedLessonIds.includes(lessonId) ? e.completedLessonIds : [...e.completedLessonIds, lessonId] }
            : e
        ),
      }));
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
        id: Date.now(),
        resourceId: input.resourceId,
        resourceTitle: input.resourceTitle,
        resourceType: input.resourceType,
        communityId: input.communityId,
        userEmail: state.session?.email || "anon",
        accessedAt: Date.now(),
      };
      setState(s => ({ ...s, accessRecords: [record, ...s.accessRecords] }));
    },
    getAccessRecords: (resourceType) => {
      if (!resourceType) return state.accessRecords;
      return state.accessRecords.filter(r => r.resourceType === resourceType);
    },

    // ── notifications ──
    markAllNotificationsRead: () => setState(s => ({ ...s, notifications: s.notifications.map(n => ({ ...n, read: true })) })),
    pushNotification: (text) => setState(s => ({
      ...s,
      notifications: [{ id: Date.now(), text, time: "Just now", read: false }, ...s.notifications],
    })),
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
