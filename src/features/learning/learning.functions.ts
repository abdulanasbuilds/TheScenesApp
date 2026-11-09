import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { nonThrowingTypedPassthrough } from "../shared/contracts";
import { withSafeHandler } from "../shared/safe-handler";

const communityIdSchema = z.object({
  communityId: z.string().uuid("Community ID must be a valid UUID."),
});

const courseIdSchema = z.object({
  courseId: z.string().uuid("Course ID must be a valid UUID."),
});

const lessonIdSchema = z.object({
  lessonId: z.string().uuid("Lesson ID must be a valid UUID."),
});

const noInputSchema = z.object({});

export const getConnectedCatalog = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(noInputSchema, async () => {
      const { getVisibleCatalog } = await import("../../server/services/catalog.service.server");
      return getVisibleCatalog();
    }),
  );

export const getLearningState = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(noInputSchema, async () => {
      const { getLearningState: getState } =
        await import("../../server/services/learning.service.server");
      return getState();
    }),
  );

export const joinCommunity = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(communityIdSchema, async ({ data, requestId }) => {
      const { joinCommunity: join } =
        await import("../../server/services/community.service.server");
      return join(data.communityId, requestId);
    }),
  );

export const leaveCommunity = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(communityIdSchema, async ({ data, requestId }) => {
      const { leaveCommunity: leave } =
        await import("../../server/services/community.service.server");
      return leave(data.communityId, requestId);
    }),
  );

export const enrolInCourse = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(courseIdSchema, async ({ data, requestId }) => {
      const { enrolInCourse: enrol } =
        await import("../../server/services/learning.service.server");
      return enrol(data.courseId, requestId);
    }),
  );

export const completeLesson = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(lessonIdSchema, async ({ data, requestId }) => {
      const { completeLesson: complete } =
        await import("../../server/services/learning.service.server");
      return complete(data.lessonId, requestId);
    }),
  );
