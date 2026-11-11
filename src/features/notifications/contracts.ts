import { z } from "zod";

/**
 * Connected notification contracts (P4-S3).
 *
 * The href allowlist is the same set of internal route families enforced by the database check, so a
 * notification row can never carry an absolute URL or an unapproved path.
 */

export const NOTIFICATION_TYPES = [
  "community_joined",
  "course_enrolled",
  "lesson_completed",
  "system",
] as const;

export const notificationHrefSchema = z
  .string()
  .max(200)
  .regex(
    /^\/(?:home|my-learning|notifications|settings|c\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/classroom\/[a-z0-9]+(?:-[a-z0-9]+)*)?)$/,
    "Notification links must be an approved internal path.",
  );

export const notificationItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  href: notificationHrefSchema.nullable(),
  read: z.boolean(),
  createdAt: z.string(),
});

export type NotificationItem = z.infer<typeof notificationItemSchema>;

export const NOTIFICATION_PAGE_SIZE = 20;
export const NOTIFICATION_PAGE_MAX = 50;

export const notificationPageSchema = z.object({
  items: z.array(notificationItemSchema),
  nextCursor: z.string().nullable(),
  unreadCount: z.number().int().nonnegative(),
});

export type NotificationPage = z.infer<typeof notificationPageSchema>;

export const notificationSummarySchema = z.object({
  unreadCount: z.number().int().nonnegative(),
});

export type NotificationSummary = z.infer<typeof notificationSummarySchema>;

export const notificationMarkResultSchema = z.object({
  changed: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
});

export type NotificationMarkResult = z.infer<typeof notificationMarkResultSchema>;

export const notificationPreferencesSchema = z.object({
  inAppLearning: z.boolean(),
  inAppCommunity: z.boolean(),
  inAppProduct: z.boolean(),
  emailLearning: z.boolean(),
  emailCommunity: z.boolean(),
  emailProduct: z.boolean(),
  pushLearning: z.boolean(),
  pushCommunity: z.boolean(),
  pushProduct: z.boolean(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

/**
 * Safe defaults, shared by the server (when no preference row exists) and the client (initial form
 * state). In-app categories default on; email and push default off because no delivery provider is
 * configured in this phase.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = Object.freeze({
  inAppLearning: true,
  inAppCommunity: true,
  inAppProduct: true,
  emailLearning: false,
  emailCommunity: false,
  emailProduct: false,
  pushLearning: false,
  pushCommunity: false,
  pushProduct: false,
});
