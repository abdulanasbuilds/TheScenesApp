/**
 * Live backend client.
 *
 * The backend (Postgres + Auth + Realtime) is provisioned and the generated
 * client at `@/integrations/supabase/client` holds the URL + publishable key.
 * Everything in the app imports from this module, so this file is the single
 * seam if the project is ever pointed at a self-hosted backend instead.
 */
import { supabase as generatedClient } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// Safe dynamic checks for environment variables to avoid Proxy access crash
const hasUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.SUPABASE_URL);
const hasKey =
  (typeof import.meta !== "undefined" && (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  (typeof process !== "undefined" && (process.env?.SUPABASE_PUBLISHABLE_KEY || process.env?.SUPABASE_ANON_KEY));

export const isSupabaseConfigured = !!(hasUrl && hasKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? (generatedClient as unknown as SupabaseClient)
  : null;
