import "@tanstack/react-start/server-only";
import { z } from "zod";
import { applyPrivateNoStoreResponse } from "../http/errors.server";
import { createRequestSupabaseClient } from "./server-client.server";

const principalSchema = z.string().uuid();
const emailSchema = z.string().email().max(254);

export type VerifiedPrincipal = Readonly<{ userId: string; email: string }>;

export async function getVerifiedPrincipal(): Promise<VerifiedPrincipal | null> {
  applyPrivateNoStoreResponse();
  const client = createRequestSupabaseClient();
  const { data, error } = await client.auth.getClaims();
  if (error) return null;
  const userId = principalSchema.safeParse(data?.claims?.sub);
  const email = emailSchema.safeParse(data?.claims?.email);
  return userId.success && email.success ? { userId: userId.data, email: email.data } : null;
}
