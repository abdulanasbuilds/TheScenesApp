import "@tanstack/react-start/server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  getCookies,
  getRequestProtocol,
  setCookie,
  setResponseHeader,
} from "@tanstack/react-start/server";
import type { Database } from "../../../db/database.types";
import { getServerEnv } from "../env.server";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function isSecureRequestProtocol(protocol: string): boolean {
  return protocol === "https";
}

export function hardenCookieOptions(options: CookieOptions, secure: boolean): CookieOptions {
  return {
    ...options,
    domain: undefined,
    httpOnly: true,
    maxAge: options.maxAge ?? COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure,
  };
}

export function createRequestSupabaseClient(source: NodeJS.ProcessEnv = process.env) {
  const env = getServerEnv(source);
  if (env.dataMode === "fixtures") {
    throw new Error("Supabase client is unavailable in fixture mode.");
  }

  const secure = isSecureRequestProtocol(getRequestProtocol());
  return createServerClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    cookieOptions: {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure,
    },
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies, headers) {
        for (const { name, value, options } of cookies) {
          setCookie(name, value, hardenCookieOptions(options, secure));
        }
        for (const [name, value] of Object.entries(headers)) setResponseHeader(name, value);
      },
    },
  });
}
