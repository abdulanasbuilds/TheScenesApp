import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

// ─── Frontend-only state ─────────────────────────────────────────────────────

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

type PersistedState = {
  session: SessionUser | null;
  accounts: StoredAccount[];
  communities: Community[];
  posts: FeedPost[];
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
  onboardingCompleted: boolean;
  onboardingInterests: string[];
  notificationPrefs: Record<string, boolean>;
};

const STORAGE_KEY = "the_scenes_frontend_state_v1";
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

function emptyState(): PersistedState {
  return {
    session: null, accounts: [], communities: [], posts: [], likedPostIds: [],
    joinedCommunityIds: [], notifications: [], courses: [], comments: [], reactions: [],
    communityEvents: [], communityResources: [], enrollments: [], accessRecords: [],
    directMessages: [], onboardingCompleted: false, onboardingInterests: [],
    notificationPrefs: { posts: true, dms: true, comments: true, sales: true },
  };
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    return emptyState();
  }
}

type CreateCommunityInput = {
  title: string; category: string; summary: string; tag: "FREE" | "PAID"; price?: string;
  color?: string; coverImageUrl?: string; iconUrl?: string; isPrivate?: boolean;
  discoveryKeywords?: string[]; screeningQuestions?: string[]; welcomeMessage?: string;
};

type AppStoreValue = {
  session: SessionUser | null; communities: Community[]; posts: FeedPost[]; notifications: AppNotification[];
  unreadCount: number; isHydrated: boolean; joinedCommunityIds: number[]; courses: Course[];
  communityResources: CommunityResource[]; communityEvents: CommunityEvent[]; enrollments: Enrollment[];
  accessRecords: AccessRecord[]; directMessages: DirectMessage[]; dmUnreadCount: number;
  onboardingCompleted: boolean; onboardingInterests: string[]; notificationPrefs: Record<string, boolean>;
  userCommunities: Community[];
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (name: string, email: string, password: string, role: "creator" | "learner") => Promise<SignUpResult>;
  signOut: () => void;
  updateProfile: (patch: { name?: string; bio?: string; photoUrl?: string; role?: "creator" | "learner" }) => void;
  getAccountRole: (email: string) => "creator" | "learner" | undefined;
  trackResourceAccess: (input: { resourceId: number; resourceTitle: string; resourceType: "lesson" | "community"; communityId?: number }) => void;
  getAccessRecords: (resourceType?: "lesson" | "community") => AccessRecord[];
  createCommunity: (input: CreateCommunityInput) => Community; updateCommunity: (id: number, patch: Partial<CreateCommunityInput>) => void;
  deleteCommunity: (id: number) => void; joinCommunity: (id: number) => void; isJoined: (id: number) => boolean;
  addPost: (input: { communityId: number; channel: string; title: string; body: string; category: string }) => FeedPost;
  toggleLike: (postId: number) => void; isLiked: (postId: number) => boolean; addComment: (postId: number, body: string) => Comment;
  getComments: (postId: number) => Comment[]; toggleReaction: (postId: number, emoji: string) => void;
  getReactions: (postId: number) => { emoji: string; count: number; reacted: boolean }[];
  createCourse: (input: { communityId: number | null; title: string; description: string; coverImageUrl?: string; thumbnail?: string }) => Course;
  updateCourse: (idOrCourse: number | Course, patch?: Partial<Course>) => void; addCourse: (course: Course) => void;
  getJoinedEmails: (communityId: number) => string[]; publishCourse: (id: number) => void; unpublishCourse: (id: number) => void; deleteCourse: (id: number) => void;
  addModule: (courseId: number, title: string) => CourseModule; updateModule: (courseId: number, moduleId: number, title: string) => void; deleteModule: (courseId: number, moduleId: number) => void;
  addLesson: (courseId: number, moduleId: number, input: { title: string; description?: string; videoUrl?: string }) => Lesson;
  updateLesson: (courseId: number, moduleId: number, lessonId: number, patch: Partial<Lesson>) => void; deleteLesson: (courseId: number, moduleId: number, lessonId: number) => void;
  addResourceToLesson: (courseId: number, moduleId: number, lessonId: number, input: { title: string; url: string }) => LessonResource;
  removeResourceFromLesson: (courseId: number, moduleId: number, lessonId: number, resourceId: number) => void;
  addCommunityResource: (communityId: number, input: { title: string; url: string }) => CommunityResource; removeCommunityResource: (id: number) => void; getCommunityResources: (communityId: number) => CommunityResource[];
  addCommunityEvent: (communityId: number, input: { title: string; description?: string; date: string; time?: string; type: CommunityEvent["type"]; hostPlatform?: EventHostPlatform; meetingUrl?: string; visibility?: EventVisibility }) => CommunityEvent;
  removeCommunityEvent: (id: number) => void; getCommunityEvents: (communityId: number) => CommunityEvent[];
  enrollInCourse: (courseId: number) => void; isEnrolled: (courseId: number) => boolean; completeLesson: (courseId: number, lessonId: number) => void; isLessonComplete: (courseId: number, lessonId: number) => boolean; getCourseProgress: (courseId: number) => { completed: number; total: number };
  completeOnboarding: (data: { role: "creator" | "learner"; interests: string[]; goals?: string[]; skillLevel?: string; name?: string; bio?: string }) => void;
  updateNotificationPrefs: (prefs: Record<string, boolean>) => void; markAllNotificationsRead: () => void; markNotificationRead: (id: number) => void; clearNotification: (id: number) => void; clearAllNotifications: () => void;
  pushNotification: (text: string, typeOrOpts?: NotificationType | { type?: NotificationType; link?: string; actorName?: string }, link?: string, actorName?: string) => void;
  sendDM: (toEmail: string, body: string) => Promise<DirectMessage>; getConversations: () => Conversation[]; getMessagesWithUser: (peerEmail: string) => DirectMessage[]; markDMsRead: (fromEmail: string) => void;
  isLessonUnlocked: (courseId: number, lessonId: number) => boolean; joinPaidCommunity: (communityId: number, onError?: (msg: string) => void) => Promise<void>;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(emptyState);
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setState(loadState()); setIsHydrated(true); }, []);
  useEffect(() => { if (isHydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state, isHydrated]);

  const mutateCourse = (id: number, fn: (course: Course) => Course) => setState(s => ({ ...s, courses: s.courses.map(c => c.id === id ? fn(c) : c) }));
  const mutateModule = (courseId: number, moduleId: number, fn: (module: CourseModule) => CourseModule) => mutateCourse(courseId, c => ({ ...c, modules: c.modules.map(m => m.id === moduleId ? fn(m) : m) }));
  const mutateLesson = (courseId: number, moduleId: number, lessonId: number, fn: (lesson: Lesson) => Lesson) => mutateModule(courseId, moduleId, m => ({ ...m, lessons: m.lessons.map(l => l.id === lessonId ? fn(l) : l) }));

  const communities = useMemo(() => [...state.communities].sort((a,b) => b.createdAt-a.createdAt), [state.communities]);
  const posts = useMemo(() => [...state.posts].sort((a,b) => b.createdAt-a.createdAt), [state.posts]);
  const value: AppStoreValue = {
    session: state.session, communities, posts, notifications: state.notifications, unreadCount: state.notifications.filter(n => !n.read).length, isHydrated, joinedCommunityIds: state.joinedCommunityIds, courses: state.courses, communityResources: state.communityResources, communityEvents: state.communityEvents, enrollments: state.enrollments, accessRecords: state.accessRecords, directMessages: state.directMessages, dmUnreadCount: state.directMessages.filter(dm => !dm.read && dm.toEmail === state.session?.email).length, onboardingCompleted: state.onboardingCompleted, onboardingInterests: state.onboardingInterests, notificationPrefs: state.notificationPrefs, userCommunities: communities.filter(c => c.creatorEmail === state.session?.email),
    signIn: async (email,password) => { const account=state.accounts.find(a=>a.email.toLowerCase()===email.toLowerCase()); if(!account) return "not_found"; if(account.password!==password) return "wrong_password"; const user:SessionUser={name:account.name,email:account.email,avatar:account.name.slice(0,2).toUpperCase(),role:account.role,photoUrl:account.photoUrl,bio:account.bio}; setState(s=>({...s,session:user})); return user; },
    signUp: async (name,email,password,role) => { if(state.accounts.some(a=>a.email.toLowerCase()===email.toLowerCase())) return "email_taken"; const user={name,email,avatar:name.slice(0,2).toUpperCase()||"TS",role} satisfies SessionUser; const account={name,email,password,role} satisfies StoredAccount; setState(s=>({...s,session:user,accounts:[...s.accounts,account],notifications:[{id:generateId(),text:`Welcome to The Scenes, ${name}!`,time:"Just now",read:false,type:"welcome"},...s.notifications]})); return user; },
    signOut: () => setState(s=>({...s,session:null})),
    updateProfile: patch => setState(s=>({ ...s, session:s.session?{...s.session,...patch}:null, accounts:s.accounts.map(a=>a.email===s.session?.email?{...a,...patch}:a) })),
    getAccountRole: email => state.accounts.find(a=>a.email.toLowerCase()===email.toLowerCase())?.role,
    updateNotificationPrefs: prefs => setState(s=>({...s,notificationPrefs:prefs})),
    completeOnboarding: data => setState(s=>({...s,onboardingCompleted:true,onboardingInterests:data.interests,session:s.session?{...s.session,role:data.role,name:data.name??s.session.name,bio:data.bio??s.session.bio}:null})),
    createCommunity: input => { const c:Community={...input,id:generateId(),members:1,creator:state.session?.name||"You",creatorEmail:state.session?.email||"",avatar:state.session?.avatar||"TS",banner:randomBanner(),createdAt:Date.now(),isPrivate:input.isPrivate??false}; setState(s=>({...s,communities:[c,...s.communities],joinedCommunityIds:[c.id,...s.joinedCommunityIds]})); return c; },
    updateCommunity:(id,patch)=>setState(s=>({...s,communities:s.communities.map(c=>c.id===id?{...c,...patch}:c)})),
    deleteCommunity:id=>setState(s=>({...s,communities:s.communities.filter(c=>c.id!==id),joinedCommunityIds:s.joinedCommunityIds.filter(x=>x!==id),courses:s.courses.filter(c=>c.communityId!==id),posts:s.posts.filter(p=>p.communityId!==id),communityResources:s.communityResources.filter(r=>r.communityId!==id),communityEvents:s.communityEvents.filter(e=>e.communityId!==id)})),
    joinCommunity:id=>setState(s=>s.joinedCommunityIds.includes(id)?s:{...s,joinedCommunityIds:[...s.joinedCommunityIds,id]}), isJoined:id=>state.joinedCommunityIds.includes(id), joinPaidCommunity:async id=>{setState(s=>s.joinedCommunityIds.includes(id)?s:{...s,joinedCommunityIds:[...s.joinedCommunityIds,id]});},
    addPost:input=>{const p:FeedPost={...input,id:generateId(),author:state.session?.name||"You",role:state.session?.role==="creator"?"Creator":"Member",avatar:state.session?.avatar||"TS",likes:0,comments:0,createdAt:Date.now()};setState(s=>({...s,posts:[p,...s.posts]}));return p;},
    toggleLike:id=>setState(s=>({...s,likedPostIds:s.likedPostIds.includes(id)?s.likedPostIds.filter(x=>x!==id):[...s.likedPostIds,id]})), isLiked:id=>state.likedPostIds.includes(id),
    addComment:(postId,body)=>{const c:Comment={id:generateId(),postId,body,author:state.session?.name||"You",avatar:state.session?.avatar||"TS",createdAt:Date.now()};setState(s=>({...s,comments:[...s.comments,c],posts:s.posts.map(p=>p.id===postId?{...p,comments:p.comments+1}:p)}));return c;}, getComments:id=>state.comments.filter(c=>c.postId===id),
    toggleReaction:(postId,emoji)=>{const userEmail=state.session?.email||"local";setState(s=>{const found=s.reactions.some(r=>r.postId===postId&&r.userEmail===userEmail&&r.emoji===emoji);return {...s,reactions:found?s.reactions.filter(r=>!(r.postId===postId&&r.userEmail===userEmail&&r.emoji===emoji)):[...s.reactions,{postId,userEmail,emoji}]}})},
    getReactions:postId=>{const userEmail=state.session?.email||"local";const counts=new Map<string,number>();state.reactions.filter(r=>r.postId===postId).forEach(r=>counts.set(r.emoji,(counts.get(r.emoji)||0)+1));return [...counts].map(([emoji,count])=>({emoji,count,reacted:state.reactions.some(r=>r.postId===postId&&r.userEmail===userEmail&&r.emoji===emoji)}));},
    createCourse:input=>{const c:Course={...input,id:generateId(),creatorEmail:state.session?.email||"",modules:[],published:false,enrollmentCount:0,createdAt:Date.now()};setState(s=>({...s,courses:[c,...s.courses]}));return c;}, updateCourse:(idOrCourse,patch)=>{const id=typeof idOrCourse==="number"?idOrCourse:idOrCourse.id;const p=typeof idOrCourse==="number"?(patch||{}):idOrCourse;mutateCourse(id,c=>({...c,...p}));}, addCourse:course=>setState(s=>({...s,courses:[course,...s.courses]})), getJoinedEmails:()=>state.session?[state.session.email]:[], publishCourse:id=>mutateCourse(id,c=>({...c,published:true})), unpublishCourse:id=>mutateCourse(id,c=>({...c,published:false})), deleteCourse:id=>setState(s=>({...s,courses:s.courses.filter(c=>c.id!==id),enrollments:s.enrollments.filter(e=>e.courseId!==id)})),
    addModule:(courseId,title)=>{const m:CourseModule={id:generateId(),title,lessons:[],order:(state.courses.find(c=>c.id===courseId)?.modules.length||0)+1};mutateCourse(courseId,c=>({...c,modules:[...c.modules,m]}));return m;}, updateModule:(cid,mid,title)=>mutateModule(cid,mid,m=>({...m,title})), deleteModule:(cid,mid)=>mutateCourse(cid,c=>({...c,modules:c.modules.filter(m=>m.id!==mid)})),
    addLesson:(cid,mid,input)=>{const mod=state.courses.find(c=>c.id===cid)?.modules.find(m=>m.id===mid);const l:Lesson={id:generateId(),title:input.title,description:input.description||"",videoUrl:input.videoUrl||"",resources:[],published:false,order:(mod?.lessons.length||0)+1,dripDays:0};mutateModule(cid,mid,m=>({...m,lessons:[...m.lessons,l]}));return l;}, updateLesson:(cid,mid,lid,patch)=>mutateLesson(cid,mid,lid,l=>({...l,...patch})), deleteLesson:(cid,mid,lid)=>mutateModule(cid,mid,m=>({...m,lessons:m.lessons.filter(l=>l.id!==lid)})),
    addResourceToLesson:(cid,mid,lid,input)=>{const r:LessonResource={id:generateId(),...input,source:detectResourceSource(input.url),addedAt:Date.now()};mutateLesson(cid,mid,lid,l=>({...l,resources:[...l.resources,r]}));return r;}, removeResourceFromLesson:(cid,mid,lid,rid)=>mutateLesson(cid,mid,lid,l=>({...l,resources:l.resources.filter(r=>r.id!==rid)})),
    addCommunityResource:(communityId,input)=>{const r:CommunityResource={id:generateId(),communityId,...input,source:detectResourceSource(input.url),addedAt:Date.now()};setState(s=>({...s,communityResources:[r,...s.communityResources]}));return r;}, removeCommunityResource:id=>setState(s=>({...s,communityResources:s.communityResources.filter(r=>r.id!==id)})),getCommunityResources:id=>state.communityResources.filter(r=>r.communityId===id),
    addCommunityEvent:(communityId,input)=>{const e:CommunityEvent={id:generateId(),communityId,createdAt:Date.now(),hostPlatform:"native",visibility:"all",...input};setState(s=>({...s,communityEvents:[e,...s.communityEvents]}));return e;},removeCommunityEvent:id=>setState(s=>({...s,communityEvents:s.communityEvents.filter(e=>e.id!==id)})),getCommunityEvents:id=>state.communityEvents.filter(e=>e.communityId===id),
    enrollInCourse:courseId=>setState(s=>s.enrollments.some(e=>e.courseId===courseId&&e.userEmail===s.session?.email)?s:{...s,enrollments:[...s.enrollments,{courseId,userEmail:s.session?.email||"",completedLessonIds:[],enrolledAt:Date.now()}],courses:s.courses.map(c=>c.id===courseId?{...c,enrollmentCount:c.enrollmentCount+1}:c)}),isEnrolled:id=>state.enrollments.some(e=>e.courseId===id&&e.userEmail===state.session?.email),completeLesson:(courseId,lessonId)=>setState(s=>({...s,enrollments:s.enrollments.map(e=>e.courseId===courseId&&e.userEmail===s.session?.email&& !e.completedLessonIds.includes(lessonId)?{...e,completedLessonIds:[...e.completedLessonIds,lessonId]}:e)})),isLessonComplete:(cid,lid)=>state.enrollments.find(e=>e.courseId===cid&&e.userEmail===state.session?.email)?.completedLessonIds.includes(lid)||false,getCourseProgress:cid=>({completed:state.enrollments.find(e=>e.courseId===cid&&e.userEmail===state.session?.email)?.completedLessonIds.length||0,total:state.courses.find(c=>c.id===cid)?.modules.flatMap(m=>m.lessons).length||0}),
    trackResourceAccess:input=>setState(s=>({...s,accessRecords:[{...input,id:generateId(),userEmail:s.session?.email||"local",accessedAt:Date.now()},...s.accessRecords]})),getAccessRecords:type=>type?state.accessRecords.filter(r=>r.resourceType===type):state.accessRecords,
    markAllNotificationsRead:()=>setState(s=>({...s,notifications:s.notifications.map(n=>({...n,read:true}))})),markNotificationRead:id=>setState(s=>({...s,notifications:s.notifications.map(n=>n.id===id?{...n,read:true}:n)})),clearNotification:id=>setState(s=>({...s,notifications:s.notifications.filter(n=>n.id!==id)})),clearAllNotifications:()=>setState(s=>({...s,notifications:[]})),pushNotification:(text,typeOrOpts,link,actorName)=>{const opts=typeof typeOrOpts==="string"?{type:typeOrOpts,link,actorName}:typeOrOpts||{};setState(s=>({...s,notifications:[{id:generateId(),text,time:"Just now",read:false,type:opts.type||"system",link:opts.link,actorName:opts.actorName},...s.notifications]}));},
    sendDM:async(toEmail,body)=>{const dm:DirectMessage={id:generateId(),fromEmail:state.session?.email||"",toEmail,body,read:false,createdAt:Date.now()};setState(s=>({...s,directMessages:[dm,...s.directMessages]}));return dm;},getConversations:()=>{const email=state.session?.email;if(!email)return[];const map=new Map<string,{lastMessage:DirectMessage;unreadCount:number}>();[...state.directMessages].sort((a,b)=>b.createdAt-a.createdAt).forEach(dm=>{const peer=dm.fromEmail===email?dm.toEmail:dm.fromEmail;if(!map.has(peer))map.set(peer,{lastMessage:dm,unreadCount:0});if(!dm.read&&dm.toEmail===email){const x=map.get(peer);if(x)x.unreadCount+=1;}});return[...map].map(([peerEmail,x])=>({peerEmail,...x}));},getMessagesWithUser:peer=>{const email=state.session?.email;return state.directMessages.filter(dm=>(dm.fromEmail===email&&dm.toEmail===peer)||(dm.fromEmail===peer&&dm.toEmail===email)).sort((a,b)=>a.createdAt-b.createdAt);},markDMsRead:from=>setState(s=>({...s,directMessages:s.directMessages.map(dm=>dm.fromEmail===from&&dm.toEmail===s.session?.email?{...dm,read:true}:dm)})),
    isLessonUnlocked:(cid,lid)=>{const lesson=state.courses.find(c=>c.id===cid)?.modules.flatMap(m=>m.lessons).find(l=>l.id===lid);if(!lesson||lesson.dripDays===0)return true;const enrolled=state.enrollments.find(e=>e.courseId===cid&&e.userEmail===state.session?.email);return !!enrolled&&(Date.now()-enrolled.enrolledAt)/86400000>=lesson.dripDays;},
  };
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const value = useContext(AppStoreContext);
  if (!value) throw new Error("useAppStore must be used within AppStoreProvider");
  return value;
}
