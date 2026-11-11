import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { nonThrowingTypedPassthrough } from "./contracts";
import { withSafeHandler } from "./safe-handler";

export const getSetupStatus = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(z.unknown(), async () => {
      const { inspectServerConfiguration } = await import("../../server/env.server");
      return inspectServerConfiguration();
    }),
  );

/** Reports account-email variable/template names and state only; never a secret value. */
export const getAuthEmailSetupStatus = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(z.unknown(), async () => {
      const { inspectAuthEmailSetup } = await import("../../server/auth-email-setup.server");
      return inspectAuthEmailSetup();
    }),
  );

/** Reports each integration by name and state with required variable names only; never a value. */
export const getIntegrationsHealth = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(z.unknown(), async () => {
      const { inspectIntegrations } = await import("../../server/integrations/health.server");
      return inspectIntegrations();
    }),
  );
