import "@tanstack/react-start/server-only";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import type { SafeErrorCode } from "../../features/shared/contracts";

const STATUS_BY_CODE: Readonly<Record<SafeErrorCode, number>> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  CONFIGURATION: 500,
  UNAVAILABLE: 503,
  INTERNAL: 500,
};

export function applySafeErrorResponse(code: SafeErrorCode, retryAfterSeconds?: number): void {
  setResponseStatus(STATUS_BY_CODE[code]);
  setResponseHeader("cache-control", "private, no-store");
  if (retryAfterSeconds !== undefined) {
    setResponseHeader("retry-after", String(Math.max(1, Math.min(300, retryAfterSeconds))));
  }
}
