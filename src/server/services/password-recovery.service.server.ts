import "@tanstack/react-start/server-only";
import { getRequestUrl } from "@tanstack/react-start/server";
import type { z } from "zod";
import type {
  PasswordRecoveryAcknowledgement,
  RecoveredPasswordStatus,
  RecoverySessionStatus,
} from "../../features/auth/contracts";
import {
  classifyRecoveryRequestError,
  isRecoveryCodeWellFormed,
} from "../../features/auth/recovery";
import { buildPasswordRecoveryRedirect } from "../../features/auth/redirects";
import type {
  passwordRecoveryRequestSchema,
  recoveredPasswordSchema,
  recoveryExchangeSchema,
} from "../../features/auth/schemas";
import { PublicAppError } from "../../features/shared/safe-handler";
import { getServerEnv } from "../env.server";
import { applyPrivateNoStoreResponse } from "../http/errors.server";
import {
  AuthRecoveryRepository,
  type AuthRecoveryRepositoryLike,
} from "../repositories/auth-recovery.repository.server";
import { localRateLimiter } from "../security/local-rate-limit.server";
import type { RateLimitResult, RateLimitRule } from "../security/local-rate-limit.server";

type RequestInput = z.infer<typeof passwordRecoveryRequestSchema>;
type ExchangeInput = z.infer<typeof recoveryExchangeSchema>;
type UpdateInput = z.infer<typeof recoveredPasswordSchema>;

const UNAVAILABLE_MESSAGE = "Password reset is temporarily unavailable. Please try again shortly.";
const RATE_LIMITED_MESSAGE = "Please wait before requesting another reset link.";

export type PasswordRecoveryDeps = Readonly<{
  mode: "fixtures" | "supabase-local" | "supabase-staging";
  repository: AuthRecoveryRepositoryLike | null;
  resolveRedirectTo: () => string;
  checkLimit: (key: string, rule: RateLimitRule) => RateLimitResult;
  prepareResponse: () => void;
}>;

export function createPasswordRecoveryDeps(): PasswordRecoveryDeps {
  const env = getServerEnv();
  return {
    mode: env.dataMode,
    repository: env.dataMode === "fixtures" ? null : new AuthRecoveryRepository(),
    resolveRedirectTo: () => buildPasswordRecoveryRedirect(getRequestUrl()),
    checkLimit: (key, rule) => localRateLimiter.check(key, rule),
    prepareResponse: applyPrivateNoStoreResponse,
  };
}

function resolveRedirect(deps: PasswordRecoveryDeps): string {
  try {
    return deps.resolveRedirectTo();
  } catch {
    throw new PublicAppError("UNAVAILABLE", "Password reset is not available from this address.");
  }
}

/**
 * Start a recovery request. Known and unknown accounts receive the identical acknowledgement; only a
 * genuine provider outage or abuse limit produces a different safe error.
 */
export async function requestPasswordRecovery(
  input: RequestInput,
  deps: PasswordRecoveryDeps = createPasswordRecoveryDeps(),
): Promise<PasswordRecoveryAcknowledgement> {
  deps.prepareResponse();
  const limit = deps.checkLimit(`account-recovery:${input.email}`, {
    limit: 5,
    windowMs: 900_000,
  });
  if (!limit.allowed) {
    throw new PublicAppError("RATE_LIMITED", RATE_LIMITED_MESSAGE, limit.retryAfterSeconds);
  }
  if (!deps.repository) {
    return { acknowledged: true, delivery: "not-configured" };
  }
  const error = await deps.repository.requestReset(input.email, resolveRedirect(deps));
  const outcome = classifyRecoveryRequestError(error);
  if (outcome === "rate-limited") {
    throw new PublicAppError("RATE_LIMITED", RATE_LIMITED_MESSAGE, 60);
  }
  if (outcome === "unavailable") {
    throw new PublicAppError("UNAVAILABLE", UNAVAILABLE_MESSAGE);
  }
  return { acknowledged: true, delivery: "requested" };
}

/**
 * Consume the PKCE recovery code. The code is single-use; a missing, replayed or malformed code is a
 * safe invalid state rather than an error that could leak provider detail.
 */
export async function completePasswordRecovery(
  input: ExchangeInput,
  deps: PasswordRecoveryDeps = createPasswordRecoveryDeps(),
): Promise<RecoverySessionStatus> {
  deps.prepareResponse();
  if (!deps.repository) return { status: "unsupported" };
  if (!isRecoveryCodeWellFormed(input.code)) return { status: "invalid" };
  const error = await deps.repository.exchangeRecoveryCode(input.code);
  if (error) {
    const outcome = classifyRecoveryRequestError(error);
    if (outcome === "unavailable") {
      throw new PublicAppError("UNAVAILABLE", UNAVAILABLE_MESSAGE);
    }
    if (outcome === "rate-limited") {
      throw new PublicAppError("RATE_LIMITED", RATE_LIMITED_MESSAGE, 60);
    }
    return { status: "invalid" };
  }
  return { status: "ready" };
}

/**
 * Set the new password on the verified recovery session, then revoke every session so a stolen or
 * stale session cannot outlive the reset.
 */
export async function updateRecoveredPassword(
  input: UpdateInput,
  deps: PasswordRecoveryDeps = createPasswordRecoveryDeps(),
): Promise<RecoveredPasswordStatus> {
  deps.prepareResponse();
  if (!deps.repository) {
    throw new PublicAppError("UNAVAILABLE", "Password reset is not available in this preview.");
  }
  const error = await deps.repository.updatePassword(input.password);
  if (error) {
    const outcome = classifyRecoveryRequestError(error);
    if (outcome === "unavailable") {
      throw new PublicAppError("UNAVAILABLE", UNAVAILABLE_MESSAGE);
    }
    throw new PublicAppError("UNAUTHENTICATED", "That reset link has expired. Request a new one.");
  }
  await deps.repository.signOutEverywhere();
  return { status: "updated" };
}
