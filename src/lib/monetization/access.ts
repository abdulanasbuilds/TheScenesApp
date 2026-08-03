/**
 * Content access control — server-side only.
 *
 * Learners get access to paid content ONLY after server-verified payment.
 * Client-side gating is UX only — the server enforces the real check.
 *
 * Access types:
 *   paid      — learner paid and was verified
 *   free      — content is free (community/course is free tier)
 *   invited   — creator granted explicit access
 *   creator   — the creator themselves (always has access)
 */

import { adminDb } from "@/lib/supabase-admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccessType = "paid" | "free" | "invited" | "creator";

export type AccessRecord = {
  id: string;
  resourceId: number;
  userEmail: string;
  accessType: AccessType;
  transactionId: string | null;
  grantedAt: string;
  expiresAt: string | null;
};

type CheckResult = { hasAccess: boolean; accessType?: AccessType; expiresAt?: string | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `access_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ─── Community access ─────────────────────────────────────────────────────────

/** Check if a user can access a community. */
export async function checkCommunityAccess(
  userEmail: string,
  communityId: number,
): Promise<CheckResult> {
  // First: check if the community is free
  const { data: community } = await adminDb.selectOne<{ tag: string; creator_email: string }>(
    "communities",
    { id: `eq.${communityId}` },
  );

  if (!community) return { hasAccess: false };

  // Creator always has access
  if (community.creator_email === userEmail) {
    return { hasAccess: true, accessType: "creator" };
  }

  // Free communities are open to all authenticated users
  if (community.tag === "FREE") {
    return { hasAccess: true, accessType: "free" };
  }

  // Paid community — check access table
  const { data: access } = await adminDb.selectOne<{
    access_type: string;
    expires_at: string | null;
  }>("community_access", { community_id: `eq.${communityId}`, user_email: `eq.${userEmail}` });

  if (!access || isExpired(access.expires_at)) {
    return { hasAccess: false };
  }

  return {
    hasAccess: true,
    accessType: access.access_type as AccessType,
    expiresAt: access.expires_at,
  };
}

/** Grant a user access to a community (called after verified payment). */
export async function grantCommunityAccess(opts: {
  userEmail: string;
  communityId: number;
  transactionId: string | null;
  accessType?: AccessType;
  expiresAt?: string | null;
}): Promise<{ ok: boolean; alreadyHad: boolean }> {
  // Check if access already exists
  const existing = await checkCommunityAccess(opts.userEmail, opts.communityId);
  if (existing.hasAccess) return { ok: true, alreadyHad: true };

  const { error } = await adminDb.upsert(
    "community_access",
    {
      id: generateId(),
      community_id: opts.communityId,
      user_email: opts.userEmail,
      transaction_id: opts.transactionId,
      access_type: opts.accessType ?? "paid",
      granted_at: new Date().toISOString(),
      expires_at: opts.expiresAt ?? null,
    },
    "community_id,user_email",
  );

  return { ok: !error, alreadyHad: false };
}

// ─── Course access ────────────────────────────────────────────────────────────

/** Check if a user can access a course. */
export async function checkCourseAccess(userEmail: string, courseId: number): Promise<CheckResult> {
  // Get course details
  const { data: course } = await adminDb.selectOne<{
    creator_email: string;
    published: boolean;
    community_id: number | null;
  }>("courses", { id: `eq.${courseId}` });

  if (!course) return { hasAccess: false };

  // Creator always has access
  if (course.creator_email === userEmail) {
    return { hasAccess: true, accessType: "creator" };
  }

  // Check course-level access record first
  const { data: access } = await adminDb.selectOne<{
    access_type: string;
    expires_at: string | null;
  }>("course_access", { course_id: `eq.${courseId}`, user_email: `eq.${userEmail}` });

  if (access && !isExpired(access.expires_at)) {
    return {
      hasAccess: true,
      accessType: access.access_type as AccessType,
      expiresAt: access.expires_at,
    };
  }

  // If course belongs to a free community, check community membership
  if (course.community_id) {
    const communityAccess = await checkCommunityAccess(userEmail, course.community_id);
    if (communityAccess.hasAccess && communityAccess.accessType !== "creator") {
      return { hasAccess: true, accessType: communityAccess.accessType };
    }
  }

  return { hasAccess: false };
}

/** Grant a user access to a course (called after verified payment). */
export async function grantCourseAccess(opts: {
  userEmail: string;
  courseId: number;
  transactionId: string | null;
  accessType?: AccessType;
  expiresAt?: string | null;
}): Promise<{ ok: boolean; alreadyHad: boolean }> {
  const existing = await checkCourseAccess(opts.userEmail, opts.courseId);
  if (existing.hasAccess && existing.accessType !== undefined) {
    return { ok: true, alreadyHad: true };
  }

  const { error } = await adminDb.upsert(
    "course_access",
    {
      id: generateId(),
      course_id: opts.courseId,
      user_email: opts.userEmail,
      transaction_id: opts.transactionId,
      access_type: opts.accessType ?? "paid",
      granted_at: new Date().toISOString(),
      expires_at: opts.expiresAt ?? null,
    },
    "course_id,user_email",
  );

  return { ok: !error, alreadyHad: false };
}

// ─── Bulk entitlement query ───────────────────────────────────────────────────

/** Get all community and course IDs a user currently has access to. */
export async function getUserEntitlements(userEmail: string): Promise<{
  communityIds: number[];
  courseIds: number[];
}> {
  const [{ data: ca }, { data: coa }] = await Promise.all([
    adminDb.select<{ community_id: number; expires_at: string | null }>("community_access", {
      user_email: `eq.${userEmail}`,
    }),
    adminDb.select<{ course_id: number; expires_at: string | null }>("course_access", {
      user_email: `eq.${userEmail}`,
    }),
  ]);

  return {
    communityIds: (ca ?? []).filter((r) => !isExpired(r.expires_at)).map((r) => r.community_id),
    courseIds: (coa ?? []).filter((r) => !isExpired(r.expires_at)).map((r) => r.course_id),
  };
}
