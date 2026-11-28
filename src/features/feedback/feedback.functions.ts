import { createServerFn } from "@tanstack/react-start";
import { nonThrowingTypedPassthrough } from "../shared/contracts";
import { withSafeHandler } from "../shared/safe-handler";
import { feedbackNoInputSchema, feedbackSubmissionSchema } from "./schemas";

/** P4-S4 feedback server functions (ADR-049). Delivery is a GitHub Issue created server-side. */

export const sendFeedback = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(feedbackSubmissionSchema, async ({ data }) => {
      const { submitFeedback } = await import("../../server/feedback/feedback.service.server");
      return submitFeedback(data);
    }),
  );

/**
 * Reports the feedback channel by name and state only, so the UI can label the channel honestly.
 *
 * No credential, repository name or issue-management detail is ever returned. When GitHub is selected
 * the browser only learns that delivery is live; the token and repository stay on the server.
 */
export const getFeedbackProviderStatus = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(feedbackNoInputSchema, async () => {
      const [{ inspectIntegrations }, { readFeedbackConfig, describeFeedbackProvider }] =
        await Promise.all([
          import("../../server/integrations/health.server"),
          import("../../server/feedback/feedback-config.server"),
        ]);
      const config = readFeedbackConfig();
      const report = inspectIntegrations();
      const state = describeFeedbackProvider(config, report.dataMode);
      return {
        state: state.state,
        provider: state.state === "ready" ? state.provider : null,
        dataMode: report.dataMode,
      } as const;
    }),
  );
