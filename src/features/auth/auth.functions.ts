import { createServerFn } from "@tanstack/react-start";
import { nonThrowingTypedPassthrough } from "../shared/contracts";
import { withSafeHandler } from "../shared/safe-handler";
import { noInputSchema, signInSchema, signUpSchema, updateProfileSchema } from "./schemas";

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
