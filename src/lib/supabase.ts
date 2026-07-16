import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Real persistence layer. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * (see supabase/schema.sql for the schema to run in your project) to
 * activate it. Until then the app keeps working from its localStorage
 * cache, so nothing breaks — data just won't survive a different browser.
 */
export const supabase: SupabaseClient | null =
  isSupabaseConfigured && typeof window !== "undefined"
    ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string)
    : null;

if (typeof window !== "undefined" && !isSupabaseConfigured) {
  console.warn(
    "[SukaSpace] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — running on the local-only (per-browser) data store. See supabase/schema.sql to connect a real database.",
  );
}
