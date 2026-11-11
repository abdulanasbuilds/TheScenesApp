import { z } from "zod";

export const publicProfileSchema = z.object({
  id: z.string().uuid(),
  handle: z.string(),
  displayName: z.string(),
  headline: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
});

export type PublicProfile = z.infer<typeof publicProfileSchema>;

export type ViewerDTO = PublicProfile &
  Readonly<{
    accountEmail: string;
    joinedCommunities: readonly Readonly<{
      id: string;
      slug: string;
      name: string;
      accentHue: number;
    }>[];
  }>;

/**
 * Recovery acknowledgements are deliberately account-agnostic. `delivery` describes the mode, not
 * whether an account exists: fixtures never send, connected modes only report that Auth accepted the
 * request. It is never a delivery claim.
 */
export const passwordRecoveryAcknowledgementSchema = z.object({
  acknowledged: z.literal(true),
  delivery: z.enum(["requested", "not-configured"]),
});

export type PasswordRecoveryAcknowledgement = z.infer<typeof passwordRecoveryAcknowledgementSchema>;

export const recoverySessionStatusSchema = z.object({
  status: z.enum(["ready", "invalid", "unsupported"]),
});

export type RecoverySessionStatus = z.infer<typeof recoverySessionStatusSchema>;

export const recoveredPasswordStatusSchema = z.object({ status: z.literal("updated") });

export type RecoveredPasswordStatus = z.infer<typeof recoveredPasswordStatusSchema>;

/** Client-safe projection of the account-email setup checker. Names and state only, never values. */
export type AuthEmailSetupView = Readonly<{
  provider: string;
  vendor: string;
  configurationOwner: string;
  state: "not-configured" | "requires-hosted-verification";
  dataMode: string;
  redirectPaths: readonly string[];
  checks: readonly Readonly<{ name: string; state: string }>[];
  notes: readonly string[];
}>;
