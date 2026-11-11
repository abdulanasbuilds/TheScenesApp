import "@tanstack/react-start/server-only";
import {
  type NotificationPage,
  type NotificationPreferences,
  type NotificationSummary,
  type NotificationMarkResult,
} from "../../features/notifications/contracts";
import {
  encodeNotificationCursor,
  type NotificationCursor,
} from "../../features/notifications/cursor";
import { PublicAppError } from "../../features/shared/safe-handler";
import { applyPrivateNoStoreResponse } from "../http/errors.server";
import { NotificationRepository } from "../repositories/notification.repository.server";
import { getVerifiedPrincipal } from "../supabase/auth.server";
import { createRequestSupabaseClient } from "../supabase/server-client.server";

/** Connected notifications service (P4-S3). Every entry point is caller-bound to the verified user. */

export type NotificationListInput = Readonly<{
  filter: "all" | "unread";
  cursor: NotificationCursor | null;
  limit: number;
}>;

export type MarkNotificationReadInput = Readonly<{ id: string }>;

export type NotificationPreferencesInput = NotificationPreferences;

async function requireUserId(): Promise<string> {
  const principal = await getVerifiedPrincipal();
  if (!principal) throw new PublicAppError("UNAUTHENTICATED", "Sign in to view notifications.");
  return principal.userId;
}

function repository(): NotificationRepository {
  return new NotificationRepository(createRequestSupabaseClient());
}

async function guarded<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    // A caller-bound read/write must never leak provider detail. Present a safe, retryable state.
    void error;
    throw new PublicAppError(
      "UNAVAILABLE",
      "Notifications are temporarily unavailable. Please try again shortly.",
    );
  }
}

export async function getNotifications(input: NotificationListInput): Promise<NotificationPage> {
  applyPrivateNoStoreResponse();
  const userId = await requireUserId();

  const repo = repository();
  const { items, hasMore } = await guarded(() =>
    repo.listOwn(userId, { filter: input.filter, limit: input.limit, cursor: input.cursor }),
  );
  const unreadCount = await guarded(() => repo.countUnread(userId));
  const last = items.at(-1);
  const nextCursor = hasMore && last ? encodeNotificationCursor(last) : null;

  return { items, nextCursor, unreadCount };
}

/** Root-loader summary for the shell badge. Unauthenticated visitors get a zero count, never an error. */
export async function getNotificationSummary(): Promise<NotificationSummary> {
  applyPrivateNoStoreResponse();
  const principal = await getVerifiedPrincipal();
  if (!principal) return { unreadCount: 0 };
  try {
    const unreadCount = await repository().countUnread(principal.userId);
    return { unreadCount };
  } catch {
    return { unreadCount: 0 };
  }
}

export async function markNotificationRead(
  input: MarkNotificationReadInput,
): Promise<NotificationMarkResult> {
  applyPrivateNoStoreResponse();
  const userId = await requireUserId();
  const repo = repository();
  const now = new Date().toISOString();
  const changed = await guarded(() => repo.markRead(userId, input.id, now));
  const unreadCount = await guarded(() => repo.countUnread(userId));
  return { changed, unreadCount };
}

export async function markAllNotificationsRead(): Promise<NotificationMarkResult> {
  applyPrivateNoStoreResponse();
  const userId = await requireUserId();
  const repo = repository();
  const now = new Date().toISOString();
  const changed = await guarded(() => repo.markAllRead(userId, now));
  const unreadCount = await guarded(() => repo.countUnread(userId));
  return { changed, unreadCount };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  applyPrivateNoStoreResponse();
  const userId = await requireUserId();
  return guarded(() => repository().readPreferences(userId));
}

export async function updateNotificationPreferences(
  input: NotificationPreferencesInput,
): Promise<NotificationPreferences> {
  applyPrivateNoStoreResponse();
  const userId = await requireUserId();
  return guarded(() => repository().upsertPreferences(userId, input));
}
