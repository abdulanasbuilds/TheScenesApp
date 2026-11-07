export const dataMode =
  import.meta.env.VITE_DATA_MODE === "supabase-local" ||
  import.meta.env.VITE_DATA_MODE === "supabase-staging"
    ? import.meta.env.VITE_DATA_MODE
    : "fixtures";

export const isConnectedDataMode = dataMode !== "fixtures";
