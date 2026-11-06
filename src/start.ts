import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { requestIdMiddleware } from "./middleware/request-id";
import { safeErrorMiddleware } from "./middleware/safe-errors";

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [requestIdMiddleware, csrfMiddleware],
  functionMiddleware: [safeErrorMiddleware],
}));
