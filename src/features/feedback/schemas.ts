import { z } from "zod";
import {
  FEEDBACK_AREAS,
  FEEDBACK_CATEGORIES,
  FEEDBACK_MESSAGE_MAX,
  FEEDBACK_MESSAGE_MIN,
  FEEDBACK_ROUTE_MAX,
  FEEDBACK_SUBJECT_MAX,
  FEEDBACK_SUBJECT_MIN,
} from "./contracts";

/**
 * A safe internal route only. Absolute URLs, protocol-relative paths ("//host") and control
 * characters are rejected so a reviewer never receives a plausible external link from user input.
 */
const INTERNAL_ROUTE = /^\/(?!\/)[A-Za-z0-9\-._~!$&'()*+,;=:@/%?#[\]]*$/;

export const feedbackRouteSchema = z
  .string()
  .trim()
  .min(1)
  .max(FEEDBACK_ROUTE_MAX)
  .refine((value) => INTERNAL_ROUTE.test(value), {
    message: "Use an internal application path.",
  });

/**
 * `submissionId` is generated once per composed note by the browser and reused across retries. The
 * server embeds it in the issue body and checks for it before creating, so a retry after a lost
 * response does not create a duplicate issue.
 */
export const feedbackSubmissionIdSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "A submission identifier is required.",
  );

export const feedbackSubmissionSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  subject: z.string().trim().min(FEEDBACK_SUBJECT_MIN).max(FEEDBACK_SUBJECT_MAX),
  message: z.string().trim().min(FEEDBACK_MESSAGE_MIN).max(FEEDBACK_MESSAGE_MAX),
  area: z.enum(FEEDBACK_AREAS).optional(),
  route: feedbackRouteSchema,
  submissionId: feedbackSubmissionIdSchema,
  /** Honeypot: a visually hidden field a real person never fills. Any value fails validation. */
  company: z.string().max(0).optional(),
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;

export const feedbackNoInputSchema = z.unknown().transform(() => undefined);
