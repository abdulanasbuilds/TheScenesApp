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
import { readRuntimeEnv } from "../runtime-env.server";
import {
  AuthRecoveryRepository,
  type AuthRecoveryRepositoryLike,
} from "../repositories/auth-recovery.repository.server";
import {
  assertRateLimit,
  consumeRateLimit,
  type RateLimitDecision,
} from "../security/rate-limit.server";

type RequestInput = z.infer<typeof passwordRecoveryRequestSchema>;
type ExchangeInput = z.infer<typeof recoveryExchangeSchema>;
type UpdateInput = z.infer<typeof recoveredPasswordSchema>;

const UNAVAILABLE_MESSAGE = "Password reset is temporarily unavailable. Please try again shortly.";
const RATE_LIMITED_MESSAGE = "Please wait before requesting another reset link.";

export type PasswordRecoveryDeps = Readonly<{
  mode: "fixtures" | "supabase-local" | "supabase-staging";
  repository: AuthRecoveryRepositoryLike | null;
  resolveRedirectTo: () => string;
  consumeLimit: (subject: string) => Promise<RateLimitDecision>;
  prepareResponse: () => void;
}>;

export function createPasswordRecoveryDeps(): PasswordRecoveryDeps {
  const env = getServerEnv();
  const runtime = readRuntimeEnv();
  return {
    mode: env.dataMode,
    repository: env.dataMode === "fixtures" ? null : new AuthRecoveryRepository(),
    resolveRedirectTo: () => buildPasswordRecoveryRedirect(getRequestUrl(), runtime.APP_ORIGIN),
    consumeLimit: (subject) => consumeRateLimit("password-reset", subject),
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
  assertRateLimit(await deps.consumeLimit(input.email), RATE_LIMITED_MESSAGE);
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
 * Set the new password on the verified recovery session, then request global refresh-session
 * revocation.
 *
 * The new password takes effect immediately. Refresh tokens for other sessions are revoked so they
 * cannot be used to obtain new access tokens. Access tokens that were already issued and cached in
 * other browser tabs may remain valid until they expire; the application still tries to sign them
 * out, but its sign-out response is best-effort and is not treated as proof that a stolen token
 * stopped working.
 */
export async function updateRecoveredPassword(
  input: UpdateInput,
  deps: PasswordRecoveryDeps = createPasswordRecoveryDeps(),
): Promise<RecoveredPasswordStatus> {
  deps.prepareResponse();
  if (!deps.repository) {
    throw new PublicAppError("UNAVAILABLE", "Password reset is not available in this preview.");
  }
  const passwordError = await deps.repository.updatePassword(input.password);
  if (passwordError) {
    const outcome = classifyRecoveryRequestError(passwordError);
    if (outcome === "unavailable") {
      throw new PublicAppError("UNAVAILABLE", UNAVAILABLE_MESSAGE);
    }
    throw new PublicAppError("UNAUTHENTICATED", "That reset link has expired. Request a new one.");
  }
  const signOutError = await deps.repository.signOutEverywhere();
  return {
    status: "updated",
    sessionRevocation: signOutError ? "unconfirmed" : "confirmed",
  };
}
