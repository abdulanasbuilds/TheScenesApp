import { z } from "zod";

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]{2,29}$/, "Use 3–30 lowercase letters, numbers, _ or -.");

const emailSchema = z
  .string()
  .trim()
  .max(254)
  .transform((value) => value.normalize("NFKC").toLowerCase())
  .pipe(z.email());

const passwordSchema = z.string().min(8).max(128);

export const signUpSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80),
    handle: handleSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const signInSchema = z.object({ email: emailSchema, password: passwordSchema }).strict();

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80),
    headline: z.string().trim().max(140).nullable().optional(),
    bio: z.string().trim().max(2_000).nullable().optional(),
    location: z.string().trim().max(80).nullable().optional(),
  })
  .strict();

/** Recovery request input. Email is normalized exactly like sign-up/sign-in. */
export const passwordRecoveryRequestSchema = z.object({ email: emailSchema }).strict();

/** PKCE recovery code returned by Supabase Auth in the recovery email link. */
export const recoveryExchangeSchema = z.object({ code: z.string().min(8).max(1024) }).strict();

/** New password for a verified recovery session. */
export const recoveredPasswordSchema = z.object({ password: passwordSchema }).strict();

export const noInputSchema = z.unknown().transform(() => undefined);
