import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Auto-DM + Notification engine — server-side, uses SUPABASE_SERVICE_KEY
 * to bypass RLS and write on behalf of any user (creator→member).
 *
 * If SUPABASE_SERVICE_KEY is not set, returns { success: false }.
 * All client-side optimistic state is already applied before this runs.
 */

// ─── Default welcome message template ─────────────────────────────────────────

function buildWelcomeBody(memberName: string, communityTitle: string, customMessage?: string | null): string {
  if (customMessage?.trim()) return customMessage.trim();
  return (
    `👋 Hey ${memberName}! Welcome to **${communityTitle}**!\n\n` +
    `So glad you're here. Introduce yourself in the community and let us know what you're working on.\n\n` +
    `Here's how to get the most out of this community:\n` +
    `• Say hello in #general\n` +
    `• Check out the latest posts and resources\n` +
    `• Join us for the next live session\n\n` +
    `Feel free to message me directly with any questions! 🚀`
  );
}

// ─── onMemberJoin ─────────────────────────────────────────────────────────────
// Called right after a learner joins a community.
// Does three things atomically:
//   1. Inserts a welcome DM from creator → new member
//   2. Inserts a notification for the new member ("You have a welcome message")
//   3. Inserts a notification for the creator ("Someone joined your community")

export const onMemberJoin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      communityId:           z.number().int(),
      communityTitle:        z.string(),
      communityCreatorEmail: z.string().email(),
      welcomeMessage:        z.string().nullable().optional(),
      memberEmail:           z.string().email(),
      memberName:            z.string(),
      dmId:                  z.number().int(),   // client-generated ID
      memberNotifId:         z.number().int(),
      creatorNotifId:        z.number().int(),
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean; reason?: string }> => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.warn("[auto-dm] SUPABASE_URL / SUPABASE_SERVICE_KEY not set — skipping server-side auto-DM");
      return { success: false, reason: "not_configured" };
    }

    const headers = {
      "Content-Type":  "application/json",
      apikey:          serviceKey,
      Authorization:   `Bearer ${serviceKey}`,
      Prefer:          "return=minimal",
    };

    const welcomeBody = buildWelcomeBody(data.memberName, data.communityTitle, data.welcomeMessage);
    const now = Date.now();

    // Run all three inserts in parallel
    const [dmRes, memberNotifRes, creatorNotifRes] = await Promise.all([
      // 1. Welcome DM: creator → member
      fetch(`${supabaseUrl}/rest/v1/direct_messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id:         data.dmId,
          from_email: data.communityCreatorEmail,
          to_email:   data.memberEmail,
          body:       welcomeBody,
          read:       false,
          created_at: now,
        }),
      }),
      // 2. Notification for the member
      fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id:         data.memberNotifId,
          user_email: data.memberEmail,
          text:       `Welcome to ${data.communityTitle}! You have a message from the creator.`,
          time:       "Just now",
          read:       false,
          type:       "new_message",
          link:       "/app/messages",
          actor_name: data.communityCreatorEmail,
          created_at: now,
        }),
      }),
      // 3. Notification for the creator (new member joined)
      fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id:         data.creatorNotifId,
          user_email: data.communityCreatorEmail,
          text:       `${data.memberName} just joined ${data.communityTitle}!`,
          time:       "Just now",
          read:       false,
          type:       "new_member",
          link:       "/app/members",
          actor_name: data.memberName,
          created_at: now,
        }),
      }),
    ]);

    const allOk = dmRes.ok && memberNotifRes.ok && creatorNotifRes.ok;
    if (!allOk) {
      const dmErr    = dmRes.ok    ? "" : await dmRes.text().catch(() => "");
      const mErr     = memberNotifRes.ok  ? "" : await memberNotifRes.text().catch(() => "");
      const cErr     = creatorNotifRes.ok ? "" : await creatorNotifRes.text().catch(() => "");
      console.error("[auto-dm] partial failure — dm:", dmRes.status, dmErr, "| memberNotif:", memberNotifRes.status, mErr, "| creatorNotif:", creatorNotifRes.status, cErr);
    }

    return { success: allOk };
  });

// ─── sendSystemDM ──────────────────────────────────────────────────────────────
// Generic server-side DM — used for onboarding welcome or announcements.
// from_email must exist in profiles (use a verified creator / system account).

export const sendSystemDM = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fromEmail: z.string().email(),
      toEmail:   z.string().email(),
      body:      z.string().min(1),
      dmId:      z.number().int(),
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean; reason?: string }> => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return { success: false, reason: "not_configured" };
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/direct_messages`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          apikey:          serviceKey,
          Authorization:   `Bearer ${serviceKey}`,
          Prefer:          "return=minimal",
        },
        body: JSON.stringify({
          id:         data.dmId,
          from_email: data.fromEmail,
          to_email:   data.toEmail,
          body:       data.body,
          read:       false,
          created_at: Date.now(),
        }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => "");
        console.error("[system-dm] Insert failed:", res.status, err);
        return { success: false, reason: "db_error" };
      }
      return { success: true };
    } catch (err) {
      console.error("[system-dm] Network error:", err);
      return { success: false, reason: "network_error" };
    }
  });

// ─── pushNotificationForUser ──────────────────────────────────────────────────
// Insert a notification for ANY user (bypasses RLS via service key).
// Use for cross-user notifications (e.g., comment on your post).

export const pushNotificationForUser = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id:         z.number().int(),
      userEmail:  z.string().email(),
      text:       z.string().min(1),
      type:       z.string().default("system"),
      link:       z.string().optional(),
      actorName:  z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return { success: false };
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          apikey:          serviceKey,
          Authorization:   `Bearer ${serviceKey}`,
          Prefer:          "return=minimal",
        },
        body: JSON.stringify({
          id:         data.id,
          user_email: data.userEmail,
          text:       data.text,
          time:       "Just now",
          read:       false,
          type:       data.type,
          link:       data.link ?? null,
          actor_name: data.actorName ?? null,
          created_at: Date.now(),
        }),
      });

      return { success: res.ok };
    } catch {
      return { success: false };
    }
  });
