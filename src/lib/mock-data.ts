export const MOCK_COMMUNITIES = [
  { id: 1, title: "AI Automation Architects", category: "AI & Automation", members: 4820, creator: "Alex Rivera", avatar: "AR", banner: "from-sky-100 to-blue-50", tag: "FREE", summary: "Deploy production-grade LLM agent systems with LangGraph, vector DBs, and no-code orchestration." },
  { id: 2, title: "Prompt Engineering Lab", category: "AI & Automation", members: 3210, creator: "Mika Chen", avatar: "MC", banner: "from-emerald-100 to-teal-50", tag: "FREE", summary: "Master GPT, Claude, and Gemini system prompt design for revenue-generating workflows." },
  { id: 3, title: "Full-Stack Engineers", category: "Software Engineering", members: 6890, creator: "David Kim", avatar: "DK", banner: "from-slate-100 to-slate-50", tag: "FREE", summary: "TypeScript, edge functions, Postgres. Ship real products weekly with peer code reviews." },
  { id: 4, title: "No-Code Empire Builders", category: "No-Code Tech", members: 2145, creator: "Sarah Jenkins", avatar: "SJ", banner: "from-amber-100 to-orange-50", tag: "FREE", summary: "Airtable, Make, n8n. Build monetized automation micro-agencies in 90 days." },
  { id: 5, title: "SaaS Growth Circle", category: "Digital Business", members: 5570, creator: "Elena Rostova", avatar: "ER", banner: "from-emerald-100 to-slate-50", tag: "FREE", summary: "MRR playbooks, cold outbound systems, and pricing teardowns from operators at $10k-$1M MRR." },
  { id: 6, title: "Creative Systems Studio", category: "Creative Design", members: 1980, creator: "Yuki Tanaka", avatar: "YT", banner: "from-cyan-100 to-slate-50", tag: "FREE", summary: "Figma component architecture, motion craft, and portfolio-grade case study rituals." },
  { id: 7, title: "Growth Marketing OS", category: "Marketing", members: 3760, creator: "Marcus Bell", avatar: "MB", banner: "from-lime-100 to-emerald-50", tag: "FREE", summary: "Lifecycle funnels, paid social science, and CRO experiments that actually move revenue." },
  { id: 8, title: "LLM Systems Guild", category: "Software Engineering", members: 2450, creator: "Priya Nair", avatar: "PN", banner: "from-cyan-100 to-sky-50", tag: "FREE", summary: "Build RAG, agentic pipelines, evals, and observability infra with production discipline." },
  { id: 9, title: "Founder OS Weekly", category: "Digital Business", members: 4110, creator: "Jonas Weiss", avatar: "JW", banner: "from-slate-100 to-blue-50", tag: "FREE", summary: "Weekly async standups, revenue reviews, and playbook drops from bootstrapped operators." },
];

export const MOCK_CATEGORIES = [
  "All", "AI & Automation", "Software Engineering", "No-Code Tech", "Digital Business", "Creative Design", "Marketing",
];

export const MOCK_COMMUNITY_POSTS = [
  { id: 1, author: "Alex Rivera", role: "AI Architect", avatar: "AR", title: "Production architecture for multi-agent LLM systems", category: "AI & Automation", likes: 42, comments: 18, body: "Just deployed our crew of 5 autonomous agents using LangGraph. Latency dropped by 340ms using connection pooling, and we finally solved the tool-selection ambiguity with a routing meta-agent. Full write-up in the thread." },
  { id: 2, author: "Sarah Jenkins", role: "Growth Lead", avatar: "SJ", title: "How we scaled an AI automation agency to $15k MRR in 90 days", category: "Digital Business", likes: 89, comments: 34, body: "The secret isn't selling complex models. It's building simple, zero-maintenance Make.com integrations for local operations. Here's the exact outbound script that closed our first 12 clients." },
  { id: 3, author: "David Kim", role: "Staff Engineer", avatar: "DK", title: "Postgres schema patterns for multi-tenant SaaS", category: "Software Engineering", likes: 61, comments: 22, body: "RLS + tenant_id + policy templates. Sharing our production migration path from single-tenant to pooled tenancy without downtime." },
];

export const MOCK_CHANNELS = [
  { id: "announcements", name: "announcements", unread: 2 },
  { id: "general-chat", name: "general-chat", unread: 0 },
  { id: "questions", name: "questions", unread: 7 },
  { id: "wins", name: "wins", unread: 1 },
  { id: "ai-automation-engineering", name: "ai-automation-engineering", unread: 0, active: true },
  { id: "resources", name: "resources", unread: 0 },
  { id: "job-board", name: "job-board", unread: 3 },
];

export const MOCK_ONLINE = [
  { name: "Alex Rivera", role: "AI Architect", avatar: "AR", status: "leader", xp: 2400, streak: 28, posts: 42, email: "alex.rivera@example.com", joinedDate: "2025-10-12", lastActive: "2 mins ago" },
  { name: "Sarah Jenkins", role: "Growth Lead", avatar: "SJ", status: "online", xp: 2220, streak: 27, posts: 39, email: "sarah.jenkins@example.com", joinedDate: "2025-11-04", lastActive: "4 hours ago" },
  { name: "David Kim", role: "Staff Eng", avatar: "DK", status: "online", xp: 2040, streak: 26, posts: 36, email: "david.kim@example.com", joinedDate: "2026-01-15", lastActive: "1 day ago" },
  { name: "Elena Rostova", role: "Creator", avatar: "ER", status: "leader", xp: 1860, streak: 25, posts: 33, email: "elena.rostova@example.com", joinedDate: "2026-01-22", lastActive: "Just now" },
  { name: "Yuki Tanaka", role: "Designer", avatar: "YT", status: "online", xp: 1680, streak: 24, posts: 30, email: "yuki.tanaka@example.com", joinedDate: "2026-02-08", lastActive: "3 hours ago" },
  { name: "Priya Nair", role: "ML Eng", avatar: "PN", status: "online", xp: 1500, streak: 23, posts: 27, email: "priya.nair@example.com", joinedDate: "2026-03-01", lastActive: "1 hour ago" },
  { name: "Marcus Bell", role: "Marketer", avatar: "MB", status: "offline", xp: 1320, streak: 22, posts: 24, email: "marcus.bell@example.com", joinedDate: "2026-03-19", lastActive: "2 days ago" },
  { name: "Jonas Weiss", role: "Founder", avatar: "JW", status: "offline", xp: 1140, streak: 21, posts: 21, email: "jonas.weiss@example.com", joinedDate: "2026-04-02", lastActive: "5 days ago" },
];

export const MOCK_BADGES = [
  { id: 1, name: "30 Day Streak", desc: "Logged in consecutively for 30 days.", icon: "flame", tone: "emerald", earned: true, meta: "Earned today" },
  { id: 2, name: "Course Master", desc: "Completed 5 advanced modules.", icon: "graduation", tone: "sky", earned: true, meta: "Earned 2 days ago" },
  { id: 3, name: "Top Contributor", desc: "Receive 50 upvotes on forum posts.", icon: "message", tone: "slate", earned: false, progress: 40, target: 50 },
  { id: 4, name: "Bug Hunter", desc: "Report a confirmed platform bug.", icon: "bug", tone: "slate", earned: false, locked: true },
];

export const MOCK_COMMUNITY_RANKS = [
  { id: 1, name: "AI Automation Architects", rank: 12, members: 1240, progressToTop10: 78, pointsToTop10: 450, tone: "emerald" },
  { id: 2, name: "Full-Stack Engineers", rank: 45, members: 890, progressToTop10: 32, pointsToTop10: 1200, tone: "amber" },
];

export const MOCK_PAYMENT_METHODS = [
  { id: 1, label: "Chase Checking", detail: "•••• 4567", type: "bank", isDefault: true },
  { id: 2, label: "PayPal", detail: "user@example.com", type: "paypal", isDefault: false },
];

export const MOCK_MONTHLY_EARNINGS = [
  { month: "Feb", amount: 4100 },
  { month: "Mar", amount: 5200 },
  { month: "Apr", amount: 4700 },
  { month: "May", amount: 6300 },
  { month: "Jun", amount: 5900 },
  { month: "Jul", amount: 7550 },
];

export const MOCK_SEARCH_COURSES = [
  { id: 1, title: "Designing for High-Density Data", desc: "Learn to structure complex enterprise applications using modern CSS grid and layout systems.", lessons: 12, progress: 45, tone: "from-sky-200 to-blue-100", tag: "PRO" },
  { id: 2, title: "Design Systems Fundamentals", desc: "Build robust shared component libraries that scale across multiple product teams.", lessons: 8, progress: 0, tone: "from-violet-200 to-indigo-100", instructor: "Sarah Jenkins" },
];

export const MOCK_CALENDAR_EVENTS = [
  { id: 1, title: "Weekly Live AMA", date: "2026-07-16", type: "session" },
  { id: 2, title: "Module 2 deadline: Agent Workflows", date: "2026-07-18", type: "deadline" },
  { id: 3, title: "Community meetup — SF chapter", date: "2026-07-22", type: "meetup" },
  { id: 4, title: "Guest lecture: Evals at scale", date: "2026-07-25", type: "session" },
  { id: 5, title: "Cohort project showcase", date: "2026-07-30", type: "meetup" },
];

export const MOCK_TRANSACTIONS = [
  { id: 1, desc: "Membership sale — Priya Nair", amount: 49, date: "2026-07-10", type: "sale" },
  { id: 2, desc: "Membership sale — Jonas Weiss", amount: 49, date: "2026-07-08", type: "sale" },
  { id: 3, desc: "Course bundle — LLM Systems Guild", amount: 129, date: "2026-07-05", type: "sale" },
  { id: 4, desc: "Membership sale — David Kim", amount: 49, date: "2026-07-03", type: "sale" },
  { id: 5, desc: "Membership sale — Marcus Bell", amount: 49, date: "2026-06-29", type: "sale" },
  { id: 6, desc: "Membership sale — Yuki Tanaka", amount: 49, date: "2026-06-27", type: "sale" },
  { id: 7, desc: "Course bundle — Prompt Engineering Lab", amount: 129, date: "2026-06-24", type: "sale" },
  { id: 8, desc: "Membership sale — Elena Rostova", amount: 49, date: "2026-06-20", type: "sale" },
  { id: 9, desc: "Payout to bank ••4821", amount: -320, date: "2026-06-15", type: "payout" },
];

export function xpToTier(xp: number) {
  if (xp >= 2200) return { name: "Diamond I", color: "text-sky-600 bg-sky-100" };
  if (xp >= 1800) return { name: "Gold I", color: "text-amber-600 bg-amber-100" };
  if (xp >= 1400) return { name: "Gold III", color: "text-amber-600 bg-amber-100" };
  if (xp >= 1000) return { name: "Silver I", color: "text-slate-600 bg-slate-200" };
  return { name: "Bronze I", color: "text-orange-700 bg-orange-100" };
}

export const MOCK_CLASSROOM_MODULES = [
  { id: 1, name: "Module 1: Large Language Model Operations", progress: 100, lessons: [
    { title: "1.1 Tokenomics & Context Windows", status: "complete" },
    { title: "1.2 Vector Database Indexing", status: "complete" },
    { title: "1.3 Embedding Model Selection", status: "complete" },
  ]},
  { id: 2, name: "Module 2: Autonomous Agent Workflows", progress: 40, lessons: [
    { title: "2.1 State Management in Agentic Frameworks", status: "in_progress" },
    { title: "2.2 Designing Fallback Loop Mechanisms", status: "locked" },
    { title: "2.3 Tool Routing & Meta-Agents", status: "locked" },
  ]},
  { id: 3, name: "Module 3: Production Deployment & Evals", progress: 0, lessons: [
    { title: "3.1 Observability with LangSmith", status: "locked" },
    { title: "3.2 Latency Optimization Patterns", status: "locked" },
    { title: "3.3 Cost Guardrails at Scale", status: "locked" },
  ]},
];

export const MOCK_DIRECT_MESSAGES = [
  { id: 1, sender: "David Chen", role: "Lead Dev", avatar: "DC", text: "Hey! The realtime listener works perfectly on the messaging side now. Zero latency.", time: "10:14 AM", unread: false },
  { id: 2, sender: "Elena Rostova", role: "Creator", avatar: "ER", text: "I just finalized the curriculum updates for the automation masterclass. Can you review?", time: "09:45 AM", unread: true },
  { id: 3, sender: "Alex Rivera", role: "AI Architect", avatar: "AR", text: "Sent over the multi-agent architecture doc — feedback welcome.", time: "Yesterday", unread: true },
  { id: 4, sender: "Sarah Jenkins", role: "Growth Lead", avatar: "SJ", text: "Booked the AMA for next Thursday 3pm ET. Confirm?", time: "Yesterday", unread: false },
  { id: 5, sender: "Priya Nair", role: "ML Eng", avatar: "PN", text: "The evals dashboard is live. Screenshot in #wins.", time: "Mon", unread: false },
];

export const MOCK_CHAT_STREAM = [
  { from: "them", text: "Hey! The realtime listener works perfectly on the messaging side now.", time: "10:14 AM" },
  { from: "me", text: "Amazing. Latency looked crushed in the last benchmark.", time: "10:15 AM" },
  { from: "them", text: "Down to ~40ms round-trip on the coast. Want me to push the diff to main?", time: "10:16 AM" },
  { from: "me", text: "Yes — squash it and I'll review after lunch.", time: "10:17 AM" },
  { from: "them", text: "Cool. Also, do we want optimistic UI on the send state?", time: "10:18 AM" },
];

export const MOCK_ANALYTICS = {
  mrr: "$14,820",
  activeMembers: "1,240",
  courseCompletionRate: "78%",
  growthPercentage: "+18.4%",
};

export const MOCK_GROWTH_SERIES = [12, 18, 22, 28, 30, 38, 44, 52, 58, 66, 71, 82];
