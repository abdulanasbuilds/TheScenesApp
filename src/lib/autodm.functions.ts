import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb } from "@/lib/supabase-admin";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType =
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

interface PushNotifInput {
  userEmail: string;
  text: string;
  type?: NotifType;
  link?: string;
  actorName?: string;
  dedupKey?: string; // prevents duplicate spam
}

interface AutoDMInput {
  fromEmail: string; // sender (creator or "system")
  toEmail: string;
  body: string;
}

interface MemberJoinInput {
  userEmail: string;
  userName: string;
  communityId: number;
  communityTitle: string;
  creatorEmail: string;
  creatorName: string;
  welcomeMessage?: string;
}

interface OnboardingCompleteInput {
  userEmail: string;
  userName: string;
  role: "creator" | "learner";
}

interface AnnouncementInput {
  memberEmails: string[];
  communityTitle: string;
  communityId: number;
  creatorEmail: string;
  creatorName: string;
  title: string;
  body: string;
}

interface CoursePublishedInput {
  memberEmails: string[];
  courseTitle: string;
  courseId: number;
  communityId: number;
  creatorName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function supabaseUrl(): string {
  return (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
}

function serviceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
}

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: serviceKey(),
    Authorization: `Bearer ${serviceKey()}`,
    Prefer: "return=minimal",
  };
}

async function dbInsert(table: string, row: Record<string, unknown>): Promise<boolean> {
  const url = supabaseUrl();
  const key = serviceKey();
  if (!url || !key) return false; // graceful degradation — localStorage takes over client-side

  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    // Treat unique-violation (dedup_key) as success — already delivered
    if (res.status === 409) return true;
    console.error(`[autodm] insert ${table} failed:`, err);
    return false;
  }
  return true;
}

function nowId(): number {
  return Date.now() + Math.floor(Math.random() * 999);
}

// ─── Core: push one notification ─────────────────────────────────────────────

export const pushNotificationForUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: PushNotifInput) => d)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.userEmail) {
      throw new Error("Unauthorized: User email mismatch.");
    }

    const ok = await dbInsert("notifications", {
      id: nowId(),
      user_email: data.userEmail,
      text: data.text,
      type: data.type ?? "system",
      link: data.link ?? null,
      actor_name: data.actorName ?? null,
      read: false,
      created_at: new Date().toISOString(),
      dedup_key: data.dedupKey ?? null,
    });
    return { ok };
  });

// ─── Core: send one DM ───────────────────────────────────────────────────────

export const sendAutoDM = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: AutoDMInput) => d)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.fromEmail) {
      throw new Error("Unauthorized: Sender email mismatch.");
    }

    const ok = await dbInsert("direct_messages", {
      id: nowId(),
      from_email: data.fromEmail,
      to_email: data.toEmail,
      body: data.body,
      read: false,
      created_at: new Date().toISOString(),
    });
    // Push a "new_message" notification to the recipient
    if (ok) {
      await dbInsert("notifications", {
        id: nowId() + 1,
        user_email: data.toEmail,
        text: `You have a new message`,
        type: "new_message",
        link: "/app/messages",
        read: false,
        created_at: new Date().toISOString(),
      });
    }
    return { ok };
  });

// ─── Triggered: member joins a community ─────────────────────────────────────

export const onMemberJoin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: MemberJoinInput) => d)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.userEmail) {
      throw new Error("Unauthorized: User email mismatch.");
    }

    // Load the community record from the database to securely retrieve trusted
    // creator information, title, and welcome message (preventing client-side BOLA/spoofing).
    const { data: community, error: fetchError } = await adminDb.selectOne<{
      title: string;
      creator: string;
      creator_email: string;
      welcome_message: string | null;
    }>("communities", { id: `eq.${data.communityId}` });

    if (fetchError || !community) {
      throw new Error("Community not found.");
    }

    // Verify the user has indeed joined the community in the DB.
    const { data: joined, error: joinError } = await adminDb.selectOne<{
      id?: string;
    }>("joined_communities", {
      user_email: `eq.${data.userEmail}`,
      community_id: `eq.${data.communityId}`,
    });

    if (joinError || !joined) {
      throw new Error("Unauthorized: User has not joined this community.");
    }

    const now = new Date().toISOString();
    const welcome =
      community.welcome_message ??
      `Hey ${data.userName}! 👋 Welcome to **${community.title}**. Explore the community, introduce yourself in the feed, and check out our courses. We're glad you're here!`;

    const results = await Promise.allSettled([
      // 1. Welcome DM from creator to new member (using trusted database values)
      dbInsert("direct_messages", {
        id: nowId(),
        from_email: community.creator_email,
        to_email: data.userEmail,
        body: welcome,
        read: false,
        created_at: now,
      }),
      // 2. "new_message" notification so the member sees it (using trusted database values)
      dbInsert("notifications", {
        id: nowId() + 1,
        user_email: data.userEmail,
        text: `${community.creator} sent you a welcome message`,
        type: "new_message",
        link: "/app/messages",
        actor_name: community.creator,
        read: false,
        created_at: now,
        dedup_key: `join-${data.communityId}-${data.userEmail}`,
      }),
      // 3. "new_member" notification for the creator (using trusted database values)
      dbInsert("notifications", {
        id: nowId() + 2,
        user_email: community.creator_email,
        text: `${data.userName} joined ${community.title}`,
        type: "new_member",
        link: "/app/members",
        actor_name: data.userName,
        read: false,
        created_at: now,
        dedup_key: `join-creator-${data.communityId}-${data.userEmail}`,
      }),
    ]);

    const ok = results.every((r) => r.status === "fulfilled" && r.value === true);
    return { ok };
  });

// ─── Triggered: onboarding completed ─────────────────────────────────────────

export const onOnboardingComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: OnboardingCompleteInput) => d)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.userEmail) {
      throw new Error("Unauthorized: User email mismatch.");
    }

    const label = data.role === "creator" ? "creator" : "learner";
    const tips =
      data.role === "creator"
        ? "Start by creating your first community and adding courses."
        : "Browse communities and join one that matches your interests.";

    const ok = await dbInsert("notifications", {
      id: nowId(),
      user_email: data.userEmail,
      text: `Welcome, ${data.userName}! Your ${label} account is ready. ${tips}`,
      type: "onboarding",
      link: data.role === "creator" ? "/app/creator" : "/discover",
      read: false,
      created_at: new Date().toISOString(),
      dedup_key: `onboarding-complete-${data.userEmail}`,
    });
    return { ok };
  });

// ─── Triggered: creator sends announcement to all community members ───────────

export const sendCommunityAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: AnnouncementInput) => d)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail || userEmail !== data.creatorEmail) {
      throw new Error("Unauthorized: Creator email mismatch.");
    }

    const { data: community } = await adminDb.selectOne<{ creator_email: string }>("communities", {
      id: `eq.${data.communityId}`,
    });
    if (!community || community.creator_email !== userEmail) {
      throw new Error("Unauthorized: Not the community creator.");
    }

    const now = new Date().toISOString();
    const batchSize = 50; // Supabase REST allows bulk insert

    // Chunk into batches to avoid request size limits
    const chunks: string[][] = [];
    for (let i = 0; i < data.memberEmails.length; i += batchSize) {
      chunks.push(data.memberEmails.slice(i, i + batchSize));
    }

    const rows = data.memberEmails.map((email, i) => ({
      id: nowId() + i,
      user_email: email,
      text: `📢 ${data.creatorName} in ${data.communityTitle}: ${data.title}`,
      type: "announcement",
      link: `/app/feed`,
      actor_name: data.creatorName,
      read: false,
      created_at: now,
      dedup_key: `announcement-${data.communityId}-${Date.now()}-${email}`,
    }));

    const url = supabaseUrl();
    const key = serviceKey();
    if (!url || !key) return { ok: false };

    const res = await fetch(`${url}/rest/v1/notifications`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(rows),
    });

    return { ok: res.ok };
  });

// ─── Triggered: creator publishes a new course / lesson ─────────────────────

export const notifyCoursePublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: CoursePublishedInput) => d)
  .handler(async ({ data, context }) => {
    const userEmail = context.claims?.email;
    if (!userEmail) {
      throw new Error("Unauthorized");
    }

    const { data: course } = await adminDb.selectOne<{ creator_email: string }>("courses", {
      id: `eq.${data.courseId}`,
    });
    if (!course || course.creator_email !== userEmail) {
      throw new Error("Unauthorized: Not the course creator.");
    }

    const now = new Date().toISOString();
    const rows = data.memberEmails.map((email, i) => ({
      id: nowId() + i,
      user_email: email,
      text: `🎓 New course: "${data.courseTitle}" by ${data.creatorName} is now available`,
      type: "course_published",
      link: `/app/classroom`,
      actor_name: data.creatorName,
      read: false,
      created_at: now,
      dedup_key: `course-pub-${data.courseId}-${email}`,
    }));

    const url = supabaseUrl();
    const key = serviceKey();
    if (!url || !key) return { ok: false };

    const res = await fetch(`${url}/rest/v1/notifications`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(rows),
    });

    return { ok: res.ok };
  });
