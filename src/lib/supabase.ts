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

export const isSupabaseConfigured = true;

export const supabase: SupabaseClient | null = generatedClient as unknown as SupabaseClient;
