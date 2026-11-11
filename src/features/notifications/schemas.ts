import { z } from "zod";
import {
  NOTIFICATION_PAGE_MAX,
  NOTIFICATION_PAGE_SIZE,
  notificationPreferencesSchema,
} from "./contracts";
import { decodeNotificationCursor, type NotificationCursor } from "./cursor";

/** Input schemas for the connected notification server functions (P4-S3). */

/**
 * The cursor is validated and decoded here so an invalid or tampered cursor becomes a normal field
 * validation error instead of a malformed query or an internal failure.
 */
export const notificationListSchema = z
  .object({
    filter: z.enum(["all", "unread"]).default("all"),
    cursor: z.string().max(300).nullable().default(null),
    limit: z.number().int().min(1).max(NOTIFICATION_PAGE_MAX).default(NOTIFICATION_PAGE_SIZE),
  })
  .strict()
  .transform(
    (
      value,
      ctx,
    ): { filter: "all" | "unread"; cursor: NotificationCursor | null; limit: number } => {
      if (value.cursor === null) return { ...value, cursor: null };
      const decoded = decodeNotificationCursor(value.cursor);
      if (decoded === null) {
        ctx.addIssue({ code: "custom", path: ["cursor"], message: "This page link is not valid." });
        return z.NEVER;
      }
      return { ...value, cursor: decoded };
    },
  );

export const markNotificationReadSchema = z.object({ id: z.string().uuid() }).strict();

export const markAllNotificationsReadSchema = z.object({}).strict();

export const notificationPreferencesUpdateSchema = notificationPreferencesSchema.strict();

export const notificationNoInputSchema = z.unknown().transform(() => undefined);
