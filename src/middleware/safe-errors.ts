import { createMiddleware } from "@tanstack/react-start";

export const safeErrorMiddleware = createMiddleware({ type: "function" }).server(
  async ({ context, next }) => {
    try {
      return await next();
    } catch {
      const requestContext = context as { requestId?: unknown } | undefined;
      const requestId =
        typeof requestContext?.requestId === "string"
          ? requestContext.requestId
          : crypto.randomUUID();
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
