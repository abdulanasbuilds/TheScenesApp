import "@tanstack/react-start/server-only";
import type { ConfigurationDiagnostic } from "../env.server";
import { inspectServerConfiguration } from "../env.server";
import { readRuntimeEnv, type RuntimeEnvSource } from "../runtime-env.server";
import { readRateLimitConfig } from "../security/rate-limit-config.server";
import { describeFeedbackProvider, readFeedbackConfig } from "../feedback/feedback-config.server";

/**
 * Non-leaking integration health for the current deployment.
 *
 * Each integration is reported by NAME and STATE with the required variable NAMES only. No value,
 * partial value or provider response is ever included. This is the surface an operator checks after
 * adding hosting variables, and the surface the application uses to explain what is connected.
 */

export type IntegrationName =
  | "supabase"
  | "rate-limit"
  | "feedback"
  | "account-email"
  | "application-email"
  | "web-push"
  | "object-storage";

export type IntegrationState = "ready" | "disabled" | "missing" | "misconfigured" | "unhealthy";

export type IntegrationHealth = Readonly<{
  name: IntegrationName;
  label: string;
  state: IntegrationState;
  detail: string;
  /** Variable names the integration reads. Names only — never values. */
  requiredVariables: readonly string[];
  /** Required variable names that are currently absent or invalid. */
  missingVariables: readonly string[];
}>;

export type IntegrationsReport = Readonly<{
  dataMode: ConfigurationDiagnostic["dataMode"];
  generatedAt: string;
  integrations: readonly IntegrationHealth[];
  /** True when every integration that is expected to be on in this mode is `ready`. */
  ok: boolean;
}>;

const VAPID_REQUIRED = ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"] as const;
const R2_REQUIRED = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_ENDPOINT",
] as const;

function supabaseHealth(configuration: ConfigurationDiagnostic): IntegrationHealth {
  const required = ["VITE_DATA_MODE", "VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
  const base = {
    name: "supabase" as const,
    label: "Learning data (Supabase)",
    requiredVariables: required,
  };

  if (configuration.ok && configuration.dataMode === "fixtures") {
    return Object.freeze({
      ...base,
      state: "disabled" as const,
      detail: "Fixture mode is active. No provider connection is created.",
      missingVariables: [],
    });
  }
  if (configuration.ok && configuration.dataMode === "supabase-local") {
    return Object.freeze({
      ...base,
      state: "ready" as const,
      detail: "Connected to the local Supabase proof.",
      missingVariables: [],
    });
  }
  if (configuration.ok && configuration.dataMode === "supabase-staging") {
    return Object.freeze({
      ...base,
      state: "ready" as const,
      detail: "Connected to the hosted Supabase project.",
      missingVariables: [],
    });
  }
  return Object.freeze({
    ...base,
    state: (configuration.dataMode === "invalid" ? "misconfigured" : "missing") as IntegrationState,
    detail: configuration.message,
    missingVariables: configuration.missingVariables,
  });
}

function rateLimitHealth(
  configuration: ConfigurationDiagnostic,
  source: RuntimeEnvSource,
): IntegrationHealth {
  const required = [
    "RATE_LIMIT_DRIVER",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_HASH_SECRET",
  ];
  const base = { name: "rate-limit" as const, label: "Rate limiting", requiredVariables: required };
  const config = readRateLimitConfig(source);

  if (config.driver === "upstash") {
    return Object.freeze({
      ...base,
      state: "ready" as const,
      detail: "Distributed limiting is active across instances.",
      missingVariables: [],
    });
  }
  if (config.driver === "misconfigured") {
    return Object.freeze({
      ...base,
      state: "misconfigured" as const,
      detail: "The selected distributed limiter is incomplete, so limits are not shared safely.",
      missingVariables: config.problems,
    });
  }
  if (configuration.dataMode === "supabase-staging") {
    return Object.freeze({
      ...base,
      state: "disabled" as const,
      detail: "Limits are per instance. Configure the distributed limiter before launch.",
      missingVariables: ["RATE_LIMIT_DRIVER", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    });
  }
  return Object.freeze({
    ...base,
    state: "ready" as const,
    detail: "In-process limiting is active for local development.",
    missingVariables: [],
  });
}

function feedbackHealth(
  configuration: ConfigurationDiagnostic,
  source: RuntimeEnvSource,
): IntegrationHealth {
  const required = ["FEEDBACK_PROVIDER", "TELEGRAM_BOT_TOKEN", "TELEGRAM_FEEDBACK_CHAT_ID"];
  const base = {
    name: "feedback" as const,
    label: "Feedback channel",
    requiredVariables: required,
  };
  const state = describeFeedbackProvider(readFeedbackConfig(source), configuration.dataMode);

  if (state.state === "ready" && state.provider === "telegram") {
    return Object.freeze({
      ...base,
      state: "ready" as const,
      detail: "Feedback is delivered to the internal Telegram channel.",
      missingVariables: [],
    });
  }
  if (state.state === "ready") {
    return Object.freeze({
      ...base,
      state: "ready" as const,
      detail: "Feedback is captured in a local preview inbox and is not delivered.",
      missingVariables: [],
    });
  }
  if (state.state === "misconfigured") {
    return Object.freeze({
      ...base,
      state: "misconfigured" as const,
      detail: "The selected Telegram channel is incomplete, so feedback is not accepted.",
      missingVariables: state.problems,
    });
  }
  return Object.freeze({
    ...base,
    state: "disabled" as const,
    detail: "No delivery channel is configured for this deployment.",
    missingVariables: ["FEEDBACK_PROVIDER", "TELEGRAM_BOT_TOKEN", "TELEGRAM_FEEDBACK_CHAT_ID"],
  });
}

function accountEmailHealth(configuration: ConfigurationDiagnostic): IntegrationHealth {
  const fixture = configuration.dataMode === "fixtures";
  return Object.freeze({
    name: "account-email" as const,
    label: "Account email (confirmation, recovery)",
    state: (fixture ? "disabled" : "ready") as IntegrationState,
    detail: fixture
      ? "Fixture mode sends no account email."
      : "Delivery is owned by Supabase Auth custom SMTP; verified in the Supabase dashboard.",
    requiredVariables: [],
    missingVariables: [],
  });
}

export function inspectIntegrations(source?: RuntimeEnvSource): IntegrationsReport {
  const environment = source ?? readRuntimeEnv();
  const configuration = inspectServerConfiguration(environment);
  const integrations = Object.freeze([
    supabaseHealth(configuration),
    rateLimitHealth(configuration, environment),
    feedbackHealth(configuration, environment),
    accountEmailHealth(configuration),
    Object.freeze({
      name: "application-email" as const,
      label: "Application email (Resend)",
      state: "disabled" as const,
      detail: "Application-originated email is not enabled; account email uses Supabase Auth.",
      requiredVariables: Object.freeze(["RESEND_API_KEY", "EMAIL_FROM"]),
      missingVariables: Object.freeze([]),
    }),
    Object.freeze({
      name: "web-push" as const,
      label: "Web push",
      state: "disabled" as const,
      detail:
        "Not enabled in this build. Enabling it needs founder approval and a Cloudflare runtime proof.",
      requiredVariables: Object.freeze([...VAPID_REQUIRED]),
      missingVariables: Object.freeze([]),
    }),
    Object.freeze({
      name: "object-storage" as const,
      label: "Platform object storage (R2)",
      state: "disabled" as const,
      detail: "No approved platform-managed object exists yet, so storage is not enabled.",
      requiredVariables: Object.freeze([...R2_REQUIRED]),
      missingVariables: Object.freeze([]),
    }),
  ]);

  const ok = integrations.every((integration) => integration.state !== "misconfigured");

  return Object.freeze({
    dataMode: configuration.dataMode,
    generatedAt: new Date().toISOString(),
    integrations,
    ok,
  });
}

/** Convenience for diagnostics that only need the merged environment source. */
export function currentRuntimeEnv(): RuntimeEnvSource {
  return readRuntimeEnv();
}
