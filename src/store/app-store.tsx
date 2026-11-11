import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { ViewerDTO } from "@/features/auth/contracts";
import { signOutCurrentSession } from "@/features/auth/auth.functions";
import { adaptConnectedCatalog } from "@/features/learning/catalog-adapter";
import type { ConnectedCatalog } from "@/features/learning/contracts";
import {
  completeLesson as completeConnectedLesson,
  enrolInCourse,
  joinCommunity as joinConnectedCommunity,
  leaveCommunity as leaveConnectedCommunity,
} from "@/features/learning/learning.functions";
import type { DataMode } from "@/lib/env";
import {
  communities,
  courses,
  categories,
  currentUserId,
  members,
  notifications as seedNotifications,
  posts as seedPosts,
} from "@/data/seed";
import type {
  Category,
  Community,
  Course,
  NotificationItem,
  Post,
  PostComment,
} from "@/data/types";
import { useRouter } from "@tanstack/react-router";

type LearningState = Readonly<{
  enrolledCourseIds: readonly string[];
  completedLessonIds: readonly string[];
}>;

type SessionUser = {
  id: string;
  name: string;
  handle: string;
  email: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
};

type AppState = {
  user: SessionUser | null;
  joined: string[];
  likedPosts: string[];
  postLikeDelta: Record<string, number>;
  extraComments: Record<string, PostComment[]>;
  notifications: NotificationItem[];
  connectedUnreadCount: number;
  completedLessons: string[];
  enrolledCourses: string[];
  rsvps: string[];
  purchases: string[];
  saved: string[];
  following: string[];
  localPosts: Post[];
};

type Action =
  | { type: "signIn"; user: SessionUser }
  | { type: "signOut" }
  | { type: "join"; slug: string }
  | { type: "leave"; slug: string }
  | { type: "toggleLike"; postId: string }
  | { type: "addComment"; postId: string; body: string }
  | { type: "markRead"; id: string }
  | { type: "markAllRead" }
  | { type: "completeLesson"; lessonId: string }
  | { type: "enroll"; courseId: string }
  | {
      type: "syncConnected";
      user: SessionUser | null;
      joined: string[];
      enrolledCourses: string[];
      completedLessons: string[];
      unreadCount: number;
    }
  | { type: "toggleRsvp"; eventId: string }
  | { type: "purchase"; productId: string }
  | { type: "toggleSave"; slug: string }
  | { type: "toggleFollow"; handle: string }
  | { type: "addPost"; post: Post }
  | {
      type: "updatePost";
      postId: string;
      changes: Pick<Post, "title" | "body" | "category">;
    };

const demoUser: SessionUser = {
  id: currentUserId,
  name: "Ama Boateng",
  handle: "amaboateng",
  email: "ama@example.com",
};

const initialState: AppState = {
  user: null,
  joined: ["ai-builders-guild", "product-design-studio", "freelance-foundry"],
  likedPosts: [],
  postLikeDelta: {},
  extraComments: {},
  notifications: seedNotifications,
  connectedUnreadCount: 0,
  completedLessons: ["les-agents-1", "les-agents-2", "les-critique-1", "les-pricing-1"],
  enrolledCourses: ["course-agents", "course-critique", "course-pricing"],
  rsvps: ["ev-1"],
  purchases: [],
  saved: ["prod-3"],
  following: ["nanaadjei"],
  localPosts: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "signIn":
      return { ...state, user: action.user };
    case "signOut":
      return { ...state, user: null };
    case "join":
      return state.joined.includes(action.slug)
        ? state
        : { ...state, joined: [...state.joined, action.slug] };
    case "leave":
      return { ...state, joined: state.joined.filter((slug) => slug !== action.slug) };
    case "toggleLike": {
      const liked = state.likedPosts.includes(action.postId);
      return {
        ...state,
        likedPosts: liked
          ? state.likedPosts.filter((id) => id !== action.postId)
          : [...state.likedPosts, action.postId],
        postLikeDelta: {
          ...state.postLikeDelta,
          [action.postId]: (state.postLikeDelta[action.postId] ?? 0) + (liked ? -1 : 1),
        },
      };
    }
    case "addComment": {
      const comment: PostComment = {
        id: `local-${Date.now()}`,
        authorId: currentUserId,
        body: action.body,
        createdAt: new Date().toISOString(),
        likes: 0,
        replies: [],
      };
      return {
        ...state,
        extraComments: {
          ...state.extraComments,
          [action.postId]: [...(state.extraComments[action.postId] ?? []), comment],
        },
      };
    }
    case "markRead":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };
    case "markAllRead":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    case "completeLesson":
      return state.completedLessons.includes(action.lessonId)
        ? state
        : { ...state, completedLessons: [...state.completedLessons, action.lessonId] };
    case "enroll":
      return state.enrolledCourses.includes(action.courseId)
        ? state
        : { ...state, enrolledCourses: [...state.enrolledCourses, action.courseId] };
    case "syncConnected":
      return {
        ...state,
        user: action.user,
        joined: action.joined,
        enrolledCourses: action.enrolledCourses,
        completedLessons: action.completedLessons,
        notifications: [],
        connectedUnreadCount: action.unreadCount,
        rsvps: [],
        purchases: [],
        saved: [],
        following: [],
        localPosts: [],
      };
    case "toggleRsvp":
      return state.rsvps.includes(action.eventId)
        ? { ...state, rsvps: state.rsvps.filter((id) => id !== action.eventId) }
        : { ...state, rsvps: [...state.rsvps, action.eventId] };
    case "purchase":
      return state.purchases.includes(action.productId)
        ? state
        : { ...state, purchases: [...state.purchases, action.productId] };
    case "toggleSave":
      return state.saved.includes(action.slug)
        ? { ...state, saved: state.saved.filter((slug) => slug !== action.slug) }
        : { ...state, saved: [...state.saved, action.slug] };
    case "toggleFollow":
      return state.following.includes(action.handle)
        ? { ...state, following: state.following.filter((h) => h !== action.handle) }
        : { ...state, following: [...state.following, action.handle] };
    case "addPost":
      return { ...state, localPosts: [action.post, ...state.localPosts] };
    case "updatePost":
      return {
        ...state,
        localPosts: state.localPosts.map((post) =>
          post.id === action.postId ? { ...post, ...action.changes } : post,
        ),
      };
    default:
      return state;
  }
}

type AppContextValue = {
  state: AppState;
  user: SessionUser | null;
  signInDemo: (email?: string) => void;
  signOut: () => Promise<void>;
  dataMode: DataMode;
  categories: Category[];
  communities: Community[];
  courses: Course[];
  joinCommunity: (slug: string) => Promise<void>;
  leaveCommunity: (slug: string) => Promise<void>;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, body: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  completeLesson: (lessonId: string) => Promise<void>;
  enroll: (courseId: string) => Promise<void>;
  toggleRsvp: (eventId: string) => void;
  purchase: (productId: string) => void;
  toggleSave: (slug: string) => void;
  toggleFollow: (handle: string) => void;
  addPost: (post: Post) => void;
  updatePost: (postId: string, changes: Pick<Post, "title" | "body" | "category">) => void;
  unreadCount: number;
  currentMember: (typeof members)[number] | undefined;
};

const AppContext = createContext<AppContextValue | null>(null);

function viewerUser(viewer: ViewerDTO): SessionUser {
  return {
    id: viewer.id,
    name: viewer.displayName,
    handle: viewer.handle,
    email: viewer.accountEmail,
    headline: viewer.headline,
    bio: viewer.bio,
    location: viewer.location,
  };
}

export function AppProvider({
  children,
  viewer,
  dataMode,
  connectedCatalog,
  learningState,
  notificationSummary,
}: {
  children: ReactNode;
  viewer: ViewerDTO | null;
  dataMode: DataMode;
  connectedCatalog: ConnectedCatalog | null;
  learningState: LearningState | null;
  notificationSummary: Readonly<{ unreadCount: number }> | null;
}) {
  const router = useRouter();
  const connectedData = useMemo(
    () => (connectedCatalog ? adaptConnectedCatalog(connectedCatalog) : null),
    [connectedCatalog],
  );
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    ...(dataMode === "fixtures"
      ? {}
      : {
          joined: viewer?.joinedCommunities.map((community) => community.slug) ?? [],
          enrolledCourses: [...(learningState?.enrolledCourseIds ?? [])],
          completedLessons: [...(learningState?.completedLessonIds ?? [])],
          notifications: [],
          connectedUnreadCount: notificationSummary?.unreadCount ?? 0,
          rsvps: [],
          purchases: [],
          saved: [],
          following: [],
        }),
    user: viewer ? viewerUser(viewer) : null,
  });

  useEffect(() => {
    if (dataMode === "fixtures") return;
    dispatch({
      type: "syncConnected",
      user: viewer ? viewerUser(viewer) : null,
      joined: viewer?.joinedCommunities.map((community) => community.slug) ?? [],
      enrolledCourses: [...(learningState?.enrolledCourseIds ?? [])],
      completedLessons: [...(learningState?.completedLessonIds ?? [])],
      unreadCount: notificationSummary?.unreadCount ?? 0,
    });
  }, [dataMode, learningState, notificationSummary, viewer]);

  const signInDemo = useCallback((email?: string) => {
    dispatch({
      type: "signIn",
      user: { ...demoUser, email: email && email.includes("@") ? email : demoUser.email },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (dataMode !== "fixtures") {
      const result = await signOutCurrentSession({ data: undefined });
      if (!result.ok) throw new Error(result.error.message);
    }
    dispatch({ type: "signOut" });
  }, [dataMode]);

  const fixtureMember = members.find((member) => member.id === currentUserId);
  const currentMember = useMemo(() => {
    if (dataMode === "fixtures") return fixtureMember;
    if (!state.user || !fixtureMember) return undefined;
    return {
      ...fixtureMember,
      id: state.user.id,
      name: state.user.name,
      handle: state.user.handle,
      headline: state.user.headline ?? "",
      bio: state.user.bio ?? "",
      location: state.user.location ?? "",
    };
  }, [dataMode, fixtureMember, state.user]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      user: state.user,
      dataMode,
      categories: dataMode === "fixtures" ? categories : (connectedData?.categories ?? []),
      communities: dataMode === "fixtures" ? communities : (connectedData?.communities ?? []),
      courses: dataMode === "fixtures" ? courses : (connectedData?.courses ?? []),
      signInDemo,
      signOut,
      joinCommunity: async (slug) => {
        if (dataMode !== "fixtures") {
          const community = connectedCatalog?.communities.find((item) => item.slug === slug);
          if (!community) throw new Error("Community is unavailable.");
          const result = await joinConnectedCommunity({ data: { communityId: community.id } });
          if (!result.ok) throw new Error(result.error.message);
        }
        dispatch({ type: "join", slug });
        if (dataMode !== "fixtures") await router.invalidate();
      },
      leaveCommunity: async (slug) => {
        if (dataMode !== "fixtures") {
          const community = connectedCatalog?.communities.find((item) => item.slug === slug);
          if (!community) throw new Error("Community is unavailable.");
          const result = await leaveConnectedCommunity({ data: { communityId: community.id } });
          if (!result.ok) throw new Error(result.error.message);
        }
        dispatch({ type: "leave", slug });
        if (dataMode !== "fixtures") await router.invalidate();
      },
      toggleLike: (postId) => dispatch({ type: "toggleLike", postId }),
      addComment: (postId, body) => dispatch({ type: "addComment", postId, body }),
      markRead: (id) => dispatch({ type: "markRead", id }),
      markAllRead: () => dispatch({ type: "markAllRead" }),
      completeLesson: async (lessonId) => {
        if (dataMode !== "fixtures") {
          const result = await completeConnectedLesson({ data: { lessonId } });
          if (!result.ok) throw new Error(result.error.message);
        }
        dispatch({ type: "completeLesson", lessonId });
        if (dataMode !== "fixtures") await router.invalidate();
      },
      enroll: async (courseId) => {
        if (dataMode !== "fixtures") {
          const result = await enrolInCourse({ data: { courseId } });
          if (!result.ok) throw new Error(result.error.message);
        }
        dispatch({ type: "enroll", courseId });
        if (dataMode !== "fixtures") await router.invalidate();
      },
      toggleRsvp: (eventId) => dispatch({ type: "toggleRsvp", eventId }),
      purchase: (productId) => dispatch({ type: "purchase", productId }),
      toggleSave: (slug) => dispatch({ type: "toggleSave", slug }),
      toggleFollow: (handle) => dispatch({ type: "toggleFollow", handle }),
      addPost: (post) => dispatch({ type: "addPost", post }),
      updatePost: (postId, changes) => dispatch({ type: "updatePost", postId, changes }),
      unreadCount:
        dataMode === "fixtures"
          ? state.notifications.filter((n) => !n.read).length
          : state.connectedUnreadCount,
      currentMember,
    }),
    [connectedCatalog, connectedData, currentMember, dataMode, router, signInDemo, signOut, state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside <AppProvider>");
  return context;
}

/** Merged post list including locally added comments, kept out of the provider for clarity. */
export function usePosts() {
  const { state } = useApp();
  return useMemo(
    () =>
      [...state.localPosts, ...seedPosts].map((post) => ({
        ...post,
        likes: post.likes + (state.postLikeDelta[post.id] ?? 0),
        comments: [...post.comments, ...(state.extraComments[post.id] ?? [])],
      })),
    [state.localPosts, state.postLikeDelta, state.extraComments],
  );
}

export function useToast() {
  return useContext(ToastContext);
}

type Toast = { id: number; title: string; description?: string };
const ToastContext = createContext<{
  toast: (title: string, description?: string) => void;
  toasts: Toast[];
  dismiss: (id: number) => void;
}>({ toast: () => {}, toasts: [], dismiss: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, description?: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-2), { id, title, description }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, toasts, dismiss }), [toast, toasts, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-300">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded p-1 text-slate-400 hover:text-white"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
