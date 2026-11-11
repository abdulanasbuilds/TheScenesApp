import "@tanstack/react-start/server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  notificationItemSchema,
  notificationPreferencesSchema,
  type NotificationItem,
  type NotificationPreferences,
} from "../../features/notifications/contracts";
import {
  buildNotificationKeysetFilter,
  type NotificationCursor,
} from "../../features/notifications/cursor";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type PreferenceColumns = Pick<
  Database["public"]["Tables"]["notification_preferences"]["Row"],
  | "in_app_learning"
  | "in_app_community"
  | "in_app_product"
  | "email_learning"
  | "email_community"
  | "email_product"
  | "push_learning"
  | "push_community"
  | "push_product"
>;

const NOTIFICATION_COLUMNS = "id, type, title, body, href, read_at, created_at";
const PREFERENCE_COLUMNS =
  "in_app_learning, in_app_community, in_app_product, email_learning, email_community, email_product, push_learning, push_community, push_product";

export type NotificationListOptions = Readonly<{
  filter: "all" | "unread";
  limit: number;
  cursor: NotificationCursor | null;
}>;

export type NotificationPageRows = Readonly<{
  items: NotificationItem[];
  hasMore: boolean;
}>;

function toItem(
  row: Pick<NotificationRow, "id" | "type" | "title" | "body" | "href" | "read_at" | "created_at">,
): NotificationItem {
  return notificationItemSchema.parse({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    read: row.read_at !== null,
    createdAt: row.created_at,
  });
}

function toPreferences(row: PreferenceColumns): NotificationPreferences {
  return notificationPreferencesSchema.parse({
    inAppLearning: row.in_app_learning,
    inAppCommunity: row.in_app_community,
    inAppProduct: row.in_app_product,
    emailLearning: row.email_learning,
    emailCommunity: row.email_community,
    emailProduct: row.email_product,
    pushLearning: row.push_learning,
    pushCommunity: row.push_community,
    pushProduct: row.push_product,
  });
}

function toPreferenceColumns(preferences: NotificationPreferences): PreferenceColumns {
  return {
    in_app_learning: preferences.inAppLearning,
    in_app_community: preferences.inAppCommunity,
    in_app_product: preferences.inAppProduct,
    email_learning: preferences.emailLearning,
    email_community: preferences.emailCommunity,
    email_product: preferences.emailProduct,
    push_learning: preferences.pushLearning,
    push_community: preferences.pushCommunity,
    push_product: preferences.pushProduct,
  };
}

/**
 * Owner-scoped notification access. Row ownership is enforced by RLS on the request client; the
 * explicit `user_id` filter keeps the keyset index in use and makes the intent readable.
 */
export class NotificationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listOwn(userId: string, options: NotificationListOptions): Promise<NotificationPageRows> {
    const base = this.client
      .from("notifications")
      .select(NOTIFICATION_COLUMNS)
      .eq("user_id", userId);
    const filtered = options.filter === "unread" ? base.is("read_at", null) : base;
    const keyed = options.cursor
      ? filtered.or(buildNotificationKeysetFilter(options.cursor))
      : filtered;

    const { data, error } = await keyed
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(options.limit + 1);
    if (error) throw error;

    const rows = data ?? [];
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    return { items: page.map(toItem), hasMore };
  }

  async countUnread(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw error;
    return count ?? 0;
  }

  /** Returns the number of rows this call actually marked read (0 when already read). */
  async markRead(userId: string, id: string, now: string): Promise<number> {
    const { data, error } = await this.client
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .eq("id", id)
      .is("read_at", null)
      .select("id");
    if (error) throw error;
    return (data ?? []).length;
  }

  /** Returns the number of rows this call marked read. */
  async markAllRead(userId: string, now: string): Promise<number> {
    const { data, error } = await this.client
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .is("read_at", null)
      .select("id");
    if (error) throw error;
    return (data ?? []).length;
  }

  async readPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await this.client
      .from("notification_preferences")
      .select(PREFERENCE_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? toPreferences(data) : DEFAULT_NOTIFICATION_PREFERENCES;
  }

  async upsertPreferences(
    userId: string,
    preferences: NotificationPreferences,
  ): Promise<NotificationPreferences> {
    const { data, error } = await this.client
      .from("notification_preferences")
      .upsert({ user_id: userId, ...toPreferenceColumns(preferences) }, { onConflict: "user_id" })
      .select(PREFERENCE_COLUMNS)
      .single();
    if (error) throw error;
    return toPreferences(data);
  }
}
