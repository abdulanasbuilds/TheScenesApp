import { createServerFn } from "@tanstack/react-start";
import { nonThrowingTypedPassthrough } from "../shared/contracts";
import { withSafeHandler } from "../shared/safe-handler";
import { feedbackNoInputSchema, feedbackSubmissionSchema } from "./schemas";

/** P4-S4 feedback server functions. Fixture mode uses the deterministic local-preview provider. */

export const sendFeedback = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(feedbackSubmissionSchema, async ({ data }) => {
      const { submitFeedback } = await import("../../server/feedback/feedback.service.server");
      return submitFeedback(data);
    }),
  );

/** Reports the feedback channel by name and state only, so the UI can label the preview honestly. */
export const getFeedbackProviderStatus = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(feedbackNoInputSchema, async () => {
      const [{ inspectIntegrations }, { readFeedbackConfig, describeFeedbackProvider }] =
        await Promise.all([
          import("../../server/integrations/health.server"),
          import("../../server/feedback/feedback-config.server"),
        ]);
      const report = inspectIntegrations();
      const state = describeFeedbackProvider(readFeedbackConfig(), report.dataMode);
      return {
        state: state.state,
        provider: state.state === "ready" ? state.provider : null,
        dataMode: report.dataMode,
      } as const;
    }),
  );
