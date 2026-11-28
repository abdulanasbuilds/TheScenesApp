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

/**
 * Reports the feedback channel by name and state only, so the UI can label the channel honestly.
 *
 * When WhatsApp is selected, the founder's normalized number is returned so the browser can build the
 * direct `wa.me` link locally. That number is the public contact the founder chose for feedback; no
 * secret (bot token, key, token) is ever returned.
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
        whatsappNumber: config.provider === "whatsapp" ? config.number : null,
        dataMode: report.dataMode,
      } as const;
    }),
  );
