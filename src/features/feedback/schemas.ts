import { z } from "zod";
import { FEEDBACK_MESSAGE_MAX, FEEDBACK_MESSAGE_MIN, FEEDBACK_ROUTE_MAX } from "./contracts";

/**
 * A safe internal route only. Absolute URLs, protocol-relative paths ("//host") and control
 * characters are rejected so the reviewer never receives a plausible external link from user input.
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

export const feedbackSubmissionSchema = z.object({
  message: z.string().trim().min(FEEDBACK_MESSAGE_MIN).max(FEEDBACK_MESSAGE_MAX),
  route: feedbackRouteSchema,
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;

export const feedbackNoInputSchema = z.unknown().transform(() => undefined);
