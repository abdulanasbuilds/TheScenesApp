import { z } from "zod";
import type { SafeResult } from "./contracts";

export class PublicAppError extends Error {
  constructor(
    readonly code:
      "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "UNAVAILABLE",
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "PublicAppError";
  }
}

type HandlerContext<T> = Readonly<{ data: T; requestId: string }>;

export function withSafeHandler<TInput, TOutput>(
  schema: z.ZodType<TInput>,
  handler: (context: HandlerContext<TInput>) => Promise<TOutput>,
  options: Readonly<{ applyResponse?: boolean }> = {},
) {
  const applyResponse = options.applyResponse ?? true;
  return async (
    context: Readonly<{ data: unknown; context?: { requestId?: string } }>,
  ): Promise<SafeResult<TOutput>> => {
    const requestId = context.context?.requestId ?? crypto.randomUUID();
    const parsed = schema.safeParse(context.data);
    if (!parsed.success) {
      if (applyResponse) {
        const { applySafeErrorResponse } = await import("../../server/http/errors.server");
        applySafeErrorResponse("VALIDATION");
      }
      const flattened = z.flattenError(parsed.error).fieldErrors;
      const fieldErrors = Object.fromEntries(
        Object.entries(flattened).filter((entry): entry is [string, string[]] =>
          Array.isArray(entry[1]),
        ),
      );
      return {
        ok: false,
        error: {
          code: "VALIDATION",
          message: "Please check the highlighted information and try again.",
          fieldErrors,
        },
        requestId,
      };
    }

    try {
      return { ok: true, data: await handler({ data: parsed.data, requestId }), requestId };
    } catch (error) {
      if (error instanceof PublicAppError) {
        if (applyResponse) {
          const { applySafeErrorResponse } = await import("../../server/http/errors.server");
          applySafeErrorResponse(error.code, error.retryAfterSeconds);
        }
        return {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            ...(error.retryAfterSeconds === undefined
              ? {}
              : { retryAfterSeconds: error.retryAfterSeconds }),
          },
          requestId,
        };
      }
      if (applyResponse) {
        const [{ applySafeErrorResponse }, { logServerEvent }] = await Promise.all([
          import("../../server/http/errors.server"),
          import("../../server/http/logger.server"),
        ]);
        applySafeErrorResponse("INTERNAL");
        logServerEvent("error", "server_function_failed", {
          requestId,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
      return {
        ok: false,
        error: { code: "INTERNAL", message: "Something went wrong. Please try again." },
        requestId,
      };
    }
  };
}
