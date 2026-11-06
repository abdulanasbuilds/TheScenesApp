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
