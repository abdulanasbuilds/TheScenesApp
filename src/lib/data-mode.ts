export const dataMode =
  import.meta.env.VITE_DATA_MODE === "supabase-local" ? "supabase-local" : "fixtures";

export const isSupabaseLocalMode = dataMode === "supabase-local";
