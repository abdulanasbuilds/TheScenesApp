import "@tanstack/react-start/server-only";
import { normalizeApprovedHostedOrigin } from "../../features/auth/redirects";
import type { ConfigurationDiagnostic } from "../env.server";
import { inspectServerConfiguration } from "../env.server";
import { readRuntimeEnv, type RuntimeEnvSource } from "../runtime-env.server";
import { readRateLimitConfig } from "../security/rate-limit-config.server";
import { describeFeedbackProvider, readFeedbackConfig } from "../feedback/feedback-config.server";
import { readPwaMode } from "../pwa/pwa-config.server";

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
  | "notifications"
  | "account-email"
  | "application-email"
  | "web-push"
  | "object-storage"
  | "pwa";

export type IntegrationState =
  "ready" | "configured-unverified" | "disabled" | "missing" | "misconfigured" | "unhealthy";

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
  /** True when configuration is coherent; this is not a real-provider verification claim. */
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
      state: "configured-unverified" as const,
      detail: "Local Supabase variables are valid. Reachability must be checked separately.",
      missingVariables: [],
    });
  }
  if (configuration.ok && configuration.dataMode === "supabase-staging") {
    return Object.freeze({
      ...base,
      state: "configured-unverified" as const,
      detail: "Hosted Supabase variables are valid. Reachability must be checked separately.",
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
      state: "configured-unverified" as const,
      detail:
        "Distributed limiter variables are valid. One controlled Upstash request is still required to verify reachability.",
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
    label: "Feedback delivery",
    requiredVariables: required,
  };
  const state = describeFeedbackProvider(readFeedbackConfig(source), configuration.dataMode);

  if (state.state === "ready" && state.provider === "telegram") {
    return Object.freeze({
      ...base,
      state: "configured-unverified" as const,
      detail:
        "Feedback is delivered to the founder-approved internal Telegram chat. Delivery must be verified once with a real message.",
      missingVariables: [],
    });
  }
  if (state.state === "ready") {
    return Object.freeze({
      ...base,
      state: "disabled" as const,
      detail: "Feedback is captured in a local preview inbox and is not delivered.",
      missingVariables: [],
    });
  }
  if (state.state === "misconfigured") {
    return Object.freeze({
      ...base,
      state: "misconfigured" as const,
      detail:
        "The selected Telegram destination is incomplete, so feedback is not accepted. This is not a fallback to the local inbox.",
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

function accountEmailHealth(
  configuration: ConfigurationDiagnostic,
  source: RuntimeEnvSource,
): IntegrationHealth {
  if (!configuration.ok) {
    return Object.freeze({
      name: "account-email" as const,
      label: "Account email (confirmation, recovery)",
      state: "disabled" as const,
      detail: "Account email is inactive until the application data configuration is valid.",
      requiredVariables: ["APP_ORIGIN"],
      missingVariables: [],
    });
  }

  const fixture = configuration.dataMode === "fixtures";
  const hosted = configuration.dataMode === "supabase-staging";
  const requiredVariables = hosted ? ["APP_ORIGIN"] : [];
  const configuredOrigin = normalizeApprovedHostedOrigin(source.APP_ORIGIN);
  const originMissing = hosted && (source.APP_ORIGIN ?? "").trim() === "";
  const originInvalid = hosted && !originMissing && configuredOrigin === null;

  if (originMissing || originInvalid) {
    return Object.freeze({
      name: "account-email" as const,
      label: "Account email (confirmation, recovery)",
      state: originMissing ? ("missing" as const) : ("misconfigured" as const),
      detail: originMissing
        ? "Set APP_ORIGIN to the exact approved HTTPS application origin before hosted account email is enabled."
        : "APP_ORIGIN must be one exact HTTPS origin with no path, query, fragment or credentials.",
      requiredVariables,
      missingVariables: ["APP_ORIGIN"],
    });
  }

  return Object.freeze({
    name: "account-email" as const,
    label: "Account email (confirmation, recovery)",
    state: (fixture ? "disabled" : "configured-unverified") as IntegrationState,
    detail: fixture
      ? "Fixture mode sends no account email."
      : "Delivered by Supabase Auth custom SMTP. SMTP credentials, domain and templates are owned by the Supabase dashboard and must be verified by inbox test once connected.",
    requiredVariables,
    missingVariables: [],
  });
}

function notificationsHealth(configuration: ConfigurationDiagnostic): IntegrationHealth {
  if (!configuration.ok) {
    return Object.freeze({
      name: "notifications" as const,
      label: "In-app notifications",
      state: "disabled" as const,
      detail:
        "Connected notifications are inactive until the application data configuration is valid.",
      requiredVariables: [],
      missingVariables: [],
    });
  }

  const fixture = configuration.dataMode === "fixtures";
  return Object.freeze({
    name: "notifications" as const,
    label: "In-app notifications",
    state: fixture ? ("disabled" as const) : ("configured-unverified" as const),
    detail: fixture
      ? "Fixture notifications are local only; no database migration is used."
      : "Application code is configured. The notification migration and owner-only access matrix still require database verification.",
    requiredVariables: [],
    missingVariables: [],
  });
}

function pwaHealth(source: RuntimeEnvSource): IntegrationHealth {
  const configuredValue = source.PWA_MODE?.trim().toLowerCase();
  const invalid =
    configuredValue !== undefined &&
    configuredValue !== "" &&
    configuredValue !== "enabled" &&
    configuredValue !== "retire";
  const mode = readPwaMode(source);
  if (invalid) {
    return Object.freeze({
      name: "pwa" as const,
      label: "Installable/offline application",
      state: "misconfigured" as const,
      detail: "PWA_MODE must be either enabled or retire. Invalid values fail safe to retirement.",
      requiredVariables: ["PWA_MODE"],
      missingVariables: ["PWA_MODE"],
    });
  }
  return Object.freeze({
    name: "pwa" as const,
    label: "Installable/offline application",
    state: mode === "retire" ? ("disabled" as const) : ("configured-unverified" as const),
    detail:
      mode === "retire"
        ? "Retirement mode unregisters the root service worker and deletes The Scenes-owned caches."
        : "PWA files and registration are enabled. Deployment, installation, offline and update behavior require browser verification.",
    requiredVariables: ["PWA_MODE"],
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
    notificationsHealth(configuration),
    accountEmailHealth(configuration, environment),
    pwaHealth(environment),
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

  const ok = integrations.every(
    (integration) =>
      integration.state !== "missing" &&
      integration.state !== "misconfigured" &&
      integration.state !== "unhealthy",
  );

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
