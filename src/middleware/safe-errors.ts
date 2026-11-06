import { createMiddleware } from "@tanstack/react-start";

export const safeErrorMiddleware = createMiddleware({ type: "function" }).server(
  async ({ context, next }) => {
    try {
      return await next();
    } catch (error) {
      const requestContext = context as { requestId?: unknown } | undefined;
      const requestId =
        typeof requestContext?.requestId === "string"
          ? requestContext.requestId
          : crypto.randomUUID();
      const { logServerEvent } = await import("../server/http/logger.server");
      logServerEvent("error", "server_function_failed", {
        requestId,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      throw new Response(
        JSON.stringify({
          ok: false,
          error: { code: "INTERNAL", message: "Something went wrong. Please try again." },
          requestId,
        }),
        {
          status: 500,
          headers: {
            "cache-control": "private, no-store",
            "content-type": "application/json; charset=utf-8",
            "x-request-id": requestId,
          },
        },
      );
    }
  },
);
