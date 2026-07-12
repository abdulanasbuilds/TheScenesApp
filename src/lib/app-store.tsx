import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MOCK_COMMUNITIES, MOCK_COMMUNITY_POSTS } from "./mock-data";

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
};

export type FeedPost = {
  id: number;
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

export type AppNotification = {
  id: number;
  text: string;
  time: string;
  read: boolean;
};

const STORAGE_KEY = "sukaspace_app_state_v1";
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

type PersistedState = {
  session: SessionUser | null;
  userCommunities: Community[];
  extraPosts: FeedPost[];
  likedPostIds: number[];
  joinedCommunityIds: number[];
  notifications: AppNotification[];
};

function defaultState(): PersistedState {
  return {
    session: null,
    userCommunities: [],
    extraPosts: [],
    likedPostIds: [],
    joinedCommunityIds: [1],
    notifications: [
      { id: 1, text: "Welcome to SukaSpace! Complete your profile to get discovered.", time: "Just now", read: false },
      { id: 2, text: "Your community discovery impressions are up 31% this month.", time: "2h ago", read: false },
      { id: 3, text: "New member joined AI Automation Architects.", time: "Yesterday", read: true },
    ],
  };
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

type CreateCommunityInput = {
  title: string;
  category: string;
  summary: string;
  tag: "FREE" | "PAID";
  price?: string;
};

type AddPostInput = {
  title: string;
  body: string;
  category: string;
};

type AppStoreValue = {
  session: SessionUser | null;
  communities: Community[];
  posts: FeedPost[];
  notifications: AppNotification[];
  unreadCount: number;
  isHydrated: boolean;
  joinedCommunityIds: number[];
  signIn: (email: string, name?: string) => SessionUser;
  signUp: (name: string, email: string, role: "creator" | "learner") => SessionUser;
  signOut: () => void;
  createCommunity: (input: CreateCommunityInput) => Community;
  addPost: (input: AddPostInput) => FeedPost;
  toggleLike: (postId: number) => void;
  isLiked: (postId: number) => boolean;
  joinCommunity: (id: number) => void;
  isJoined: (id: number) => boolean;
  markAllNotificationsRead: () => void;
  pushNotification: (text: string) => void;
};

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
    } catch {
      // ignore write failures (private mode, quota, etc.)
    }
  }, [state, isHydrated]);

  const communities = useMemo<Community[]>(() => {
    const seeded: Community[] = MOCK_COMMUNITIES.map((c) => ({ ...c, tag: c.tag as "FREE" | "PAID", createdAt: 0 }));
    return [...state.userCommunities, ...seeded].sort((a, b) => b.createdAt - a.createdAt);
  }, [state.userCommunities]);

  const posts = useMemo<FeedPost[]>(() => {
    const seeded: FeedPost[] = MOCK_COMMUNITY_POSTS.map((p) => ({ ...p, createdAt: 0 }));
    const merged = [...state.extraPosts, ...seeded].sort((a, b) => b.createdAt - a.createdAt);
    return merged.map((p) => (state.likedPostIds.includes(p.id) ? { ...p, likes: p.likes + 1 } : p));
  }, [state.extraPosts, state.likedPostIds]);

  const value: AppStoreValue = {
    session: state.session,
    communities,
    posts,
    notifications: state.notifications,
    unreadCount: state.notifications.filter((n) => !n.read).length,
    isHydrated,
    joinedCommunityIds: state.joinedCommunityIds,
    signIn: (email, name) => {
      const user: SessionUser = { name: name || email.split("@")[0], email, avatar: (name || email).slice(0, 2).toUpperCase(), role: "learner" };
      setState((s) => ({ ...s, session: user }));
      return user;
    },
    signUp: (name, email, role) => {
      const user: SessionUser = { name, email, avatar: name.slice(0, 2).toUpperCase() || "YU", role };
      setState((s) => ({ ...s, session: user }));
      return user;
    },
    signOut: () => setState((s) => ({ ...s, session: null })),
    createCommunity: (input) => {
      const community: Community = {
        id: Date.now(),
        title: input.title,
        category: input.category,
        members: 1,
        creator: state.session?.name || "You",
        avatar: state.session?.avatar || "YU",
        banner: randomBanner(),
        tag: input.tag,
        price: input.price,
        summary: input.summary,
        createdAt: Date.now(),
      };
      setState((s) => ({
        ...s,
        userCommunities: [community, ...s.userCommunities],
        joinedCommunityIds: [community.id, ...s.joinedCommunityIds],
        notifications: [{ id: Date.now(), text: `"${community.title}" is now live on Discover.`, time: "Just now", read: false }, ...s.notifications],
      }));
      return community;
    },
    addPost: (input) => {
      const post: FeedPost = {
        id: Date.now(),
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
      return post;
    },
    toggleLike: (postId) => {
      setState((s) => ({
        ...s,
        likedPostIds: s.likedPostIds.includes(postId) ? s.likedPostIds.filter((id) => id !== postId) : [...s.likedPostIds, postId],
      }));
    },
    isLiked: (postId) => state.likedPostIds.includes(postId),
    joinCommunity: (id) => {
      setState((s) => (s.joinedCommunityIds.includes(id) ? s : { ...s, joinedCommunityIds: [...s.joinedCommunityIds, id] }));
    },
    isJoined: (id) => state.joinedCommunityIds.includes(id),
    markAllNotificationsRead: () => {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    },
    pushNotification: (text) => {
      setState((s) => ({ ...s, notifications: [{ id: Date.now(), text, time: "Just now", read: false }, ...s.notifications] }));
    },
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
