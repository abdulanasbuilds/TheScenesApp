import { z } from "zod";

export const safeErrorCodeSchema = z.enum([
  "VALIDATION",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "CONFIGURATION",
  "UNAVAILABLE",
  "INTERNAL",
]);

export type SafeErrorCode = z.infer<typeof safeErrorCodeSchema>;

export type SafeError = Readonly<{
  code: SafeErrorCode;
  message: string;
  fieldErrors?: Readonly<Record<string, readonly string[]>>;
  retryAfterSeconds?: number;
}>;

export type SafeResult<T> =
  | Readonly<{ ok: true; data: T; requestId: string }>
  | Readonly<{ ok: false; error: SafeError; requestId: string }>;

export const nonThrowingTypedPassthrough = <T>(value: T): T => value;
