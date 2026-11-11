import { createServerFn } from "@tanstack/react-start";
import { nonThrowingTypedPassthrough } from "../shared/contracts";
import { withSafeHandler } from "../shared/safe-handler";
import {
  markAllNotificationsReadSchema,
  markNotificationReadSchema,
  notificationListSchema,
  notificationNoInputSchema,
  notificationPreferencesUpdateSchema,
} from "./schemas";

/** Connected notification server functions (P4-S3). Fixture mode never calls these. */

export const getNotificationsPage = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(notificationListSchema, async ({ data }) => {
      const { getNotifications } =
        await import("../../server/services/notification.service.server");
      return getNotifications(data);
    }),
  );

export const getNotificationUnreadCount = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(notificationNoInputSchema, async () => {
      const { getNotificationSummary } =
        await import("../../server/services/notification.service.server");
      return getNotificationSummary();
    }),
  );

export const markNotificationRead = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(markNotificationReadSchema, async ({ data }) => {
      const { markNotificationRead: mark } =
        await import("../../server/services/notification.service.server");
      return mark(data);
    }),
  );

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(markAllNotificationsReadSchema, async () => {
      const { markAllNotificationsRead: markAll } =
        await import("../../server/services/notification.service.server");
      return markAll();
    }),
  );

export const getNotificationPreferences = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(notificationNoInputSchema, async () => {
      const { getNotificationPreferences: read } =
        await import("../../server/services/notification.service.server");
      return read();
    }),
  );

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(notificationPreferencesUpdateSchema, async ({ data }) => {
      const { updateNotificationPreferences: write } =
        await import("../../server/services/notification.service.server");
      return write(data);
    }),
  );
