import { createServerFn } from "@tanstack/react-start";
import { nonThrowingTypedPassthrough } from "../shared/contracts";
import { withSafeHandler } from "../shared/safe-handler";
import {
  noInputSchema,
  passwordRecoveryRequestSchema,
  recoveredPasswordSchema,
  recoveryExchangeSchema,
  signInSchema,
  signUpSchema,
  updateProfileSchema,
} from "./schemas";

export const signUpWithPassword = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(signUpSchema, async ({ data }) => {
      const { signUp } = await import("../../server/services/auth.service.server");
      return signUp(data);
    }),
  );

export const signInWithPassword = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(signInSchema, async ({ data }) => {
      const { signIn } = await import("../../server/services/auth.service.server");
      return signIn(data);
    }),
  );

export const signOutCurrentSession = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(noInputSchema, async () => {
      const { signOut } = await import("../../server/services/auth.service.server");
      return signOut();
    }),
  );

export const getCurrentViewer = createServerFn({ method: "GET" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(noInputSchema, async () => {
      const { getSessionProfile } =
        await import("../../server/services/session-profile.service.server");
      return getSessionProfile();
    }),
  );

export const updateOwnProfile = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(updateProfileSchema, async ({ data }) => {
      const { updateProfile } = await import("../../server/services/auth.service.server");
      return updateProfile(data);
    }),
  );

/** Ask Supabase Auth to start password recovery. Always acknowledges without revealing existence. */
export const requestAccountPasswordRecovery = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(passwordRecoveryRequestSchema, async ({ data }) => {
      const { requestPasswordRecovery } =
        await import("../../server/services/password-recovery.service.server");
      return requestPasswordRecovery(data);
    }),
  );

/** Consume the PKCE code from the recovery email link and establish the recovery session. */
export const completeAccountPasswordRecovery = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(recoveryExchangeSchema, async ({ data }) => {
      const { completePasswordRecovery } =
        await import("../../server/services/password-recovery.service.server");
      return completePasswordRecovery(data);
    }),
  );

/** Set the new password on the verified recovery session and revoke all sessions. */
export const updateRecoveredAccountPassword = createServerFn({ method: "POST" })
  .validator(nonThrowingTypedPassthrough)
  .handler(
    withSafeHandler(recoveredPasswordSchema, async ({ data }) => {
      const { updateRecoveredPassword } =
        await import("../../server/services/password-recovery.service.server");
      return updateRecoveredPassword(data);
    }),
  );
