import "@tanstack/react-start/server-only";
import type { ProviderErrorShape } from "../../features/auth/recovery";
import { createRequestSupabaseClient } from "../supabase/server-client.server";

type RequestSupabaseClient = ReturnType<typeof createRequestSupabaseClient>;

export type AuthRecoveryRepositoryLike = Readonly<{
  requestReset(email: string, redirectTo: string): Promise<ProviderErrorShape>;
  exchangeRecoveryCode(code: string): Promise<ProviderErrorShape>;
  updatePassword(password: string): Promise<ProviderErrorShape>;
  signOutEverywhere(): Promise<ProviderErrorShape>;
}>;

function toShape(error: { status?: number; code?: string } | null): ProviderErrorShape {
  return error ? { status: error.status ?? null, code: error.code ?? null } : null;
}

/**
 * Narrow wrapper around the Supabase Auth recovery methods.
 *
 * It uses the request-scoped user client (publishable key + caller cookies) only. No admin key, no
 * service role and no application-built token or link. Provider response bodies are reduced to a
 * status/code shape so nothing sensitive can be logged or returned.
 */
export class AuthRecoveryRepository implements AuthRecoveryRepositoryLike {
  constructor(private readonly client: RequestSupabaseClient = createRequestSupabaseClient()) {}

  async requestReset(email: string, redirectTo: string): Promise<ProviderErrorShape> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo });
    return toShape(error);
  }

  async exchangeRecoveryCode(code: string): Promise<ProviderErrorShape> {
    const { error } = await this.client.auth.exchangeCodeForSession(code);
    return toShape(error);
  }

  async updatePassword(password: string): Promise<ProviderErrorShape> {
    const { error } = await this.client.auth.updateUser({ password });
    return toShape(error);
  }

  async signOutEverywhere(): Promise<ProviderErrorShape> {
    const { error } = await this.client.auth.signOut({ scope: "global" });
    return toShape(error);
  }
}
