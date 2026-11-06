import "@tanstack/react-start/server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getCookies, setCookie, setResponseHeader } from "@tanstack/react-start/server";
import type { Database } from "../../../db/database.types";
import { getServerEnv } from "../env.server";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function hardenCookieOptions(options: CookieOptions): CookieOptions {
  return {
    ...options,
    domain: undefined,
    httpOnly: true,
    maxAge: options.maxAge ?? COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: false,
  };
}

export function createRequestSupabaseClient(source: NodeJS.ProcessEnv = process.env) {
  const env = getServerEnv(source);
  if (env.dataMode !== "supabase-local") {
    throw new Error("Supabase client is unavailable in fixture mode.");
  }

  return createServerClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    cookieOptions: {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: false,
    },
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies, headers) {
        for (const { name, value, options } of cookies) {
          setCookie(name, value, hardenCookieOptions(options));
        }
        for (const [name, value] of Object.entries(headers)) setResponseHeader(name, value);
      },
    },
  });
}
