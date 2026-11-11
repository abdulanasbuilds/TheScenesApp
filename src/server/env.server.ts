import "@tanstack/react-start/server-only";
import { EnvValidationError, parseAppEnv, type AppEnv } from "../lib/env";
import { readRuntimeEnv, type RuntimeEnvSource } from "./runtime-env.server";

export type ConfigurationDiagnostic = Readonly<{
  ok: boolean;
  dataMode: "fixtures" | "supabase-local" | "supabase-staging" | "missing" | "invalid";
  missingVariables: readonly string[];
  message: string;
}>;

function rawServerEnv(source: RuntimeEnvSource): Record<string, string | undefined> {
  return {
    VITE_DATA_MODE: source.VITE_DATA_MODE,
    VITE_SUPABASE_URL: source.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: source.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

/** Validate the runtime environment (Cloudflare bindings merged over `process.env`). */
export function getServerEnv(source: RuntimeEnvSource = readRuntimeEnv()): AppEnv {
  return parseAppEnv(rawServerEnv(source));
}

export function inspectServerConfiguration(
  source: RuntimeEnvSource = readRuntimeEnv(),
): ConfigurationDiagnostic {
  try {
    const env = getServerEnv(source);
    return {
      ok: true,
      dataMode: env.dataMode,
      missingVariables: [],
      message:
        env.dataMode === "fixtures"
          ? "Fixture mode is ready. No provider connection will be created."
          : env.dataMode === "supabase-local"
            ? "Local Supabase configuration is valid and ready for a request."
            : "Hosted Supabase staging configuration is valid and ready for a request.",
    };
  } catch (error) {
    const code = error instanceof EnvValidationError ? error.code : "UNKNOWN";
    const missingVariables = [
      ...(code === "MODE_MISSING" ? ["VITE_DATA_MODE"] : []),
      ...(code === "SUPABASE_URL_REQUIRED" ? ["VITE_SUPABASE_URL"] : []),
      ...(code === "SUPABASE_KEY_REQUIRED" ? ["VITE_SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    return {
      ok: false,
      dataMode: code === "MODE_MISSING" ? "missing" : "invalid",
      missingVariables,
      message:
        missingVariables.length > 0
          ? `Configuration is incomplete. Add ${missingVariables.join(", ")} to the ignored local environment file or the hosting dashboard variables.`
          : "Configuration is invalid. Check the documented data mode and provider settings.",
    };
  }
}
