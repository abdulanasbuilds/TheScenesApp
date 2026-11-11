import "@tanstack/react-start/server-only";
import { inspectServerConfiguration, type ConfigurationDiagnostic } from "./env.server";

export type AuthEmailCheckState =
  "configured-in-app" | "manual-verification-required" | "not-configured";

export type AuthEmailSetupStatus = Readonly<{
  provider: "supabase-auth-custom-smtp";
  vendor: "resend";
  configurationOwner: "supabase-auth";
  state: "not-configured" | "requires-hosted-verification";
  dataMode: ConfigurationDiagnostic["dataMode"];
  redirectPaths: readonly string[];
  checks: readonly Readonly<{ name: string; state: AuthEmailCheckState }>[];
  notes: readonly string[];
}>;

/**
 * Report the account-email setup by NAME and STATE only.
 *
 * Resend is configured as Supabase Auth custom SMTP, so the application cannot read the SMTP
 * host/port/username/password, the sending domain or the email templates. This check never reads,
 * prints or returns a secret value; it only lists what a human must verify in the approved Supabase
 * project after explicit remote approval.
 */
export function inspectAuthEmailSetup(
  source: NodeJS.ProcessEnv = process.env,
): AuthEmailSetupStatus {
  const configuration = inspectServerConfiguration(source);
  const fixture = configuration.dataMode === "fixtures";

  return Object.freeze({
    provider: "supabase-auth-custom-smtp" as const,
    vendor: "resend" as const,
    configurationOwner: "supabase-auth" as const,
    state: fixture ? ("not-configured" as const) : ("requires-hosted-verification" as const),
    dataMode: configuration.dataMode,
    redirectPaths: Object.freeze(["/auth/confirm", "/reset-password"]),
    checks: Object.freeze([
      { name: "Supabase Auth SMTP host", state: "manual-verification-required" as const },
      { name: "Supabase Auth SMTP port", state: "manual-verification-required" as const },
      { name: "Supabase Auth SMTP username", state: "manual-verification-required" as const },
      {
        name: "Supabase Auth SMTP password (scoped Resend key)",
        state: "manual-verification-required" as const,
      },
      { name: "Verified Resend sending domain", state: "manual-verification-required" as const },
      { name: "Confirmation email template", state: "manual-verification-required" as const },
      { name: "Recovery email template", state: "manual-verification-required" as const },
      { name: "Application redirect allowlist", state: "configured-in-app" as const },
      { name: "Client-bundle secret scan", state: "manual-verification-required" as const },
    ]),
    notes: Object.freeze([
      "The application cannot read Supabase Auth SMTP settings; verify them in the approved project.",
      "No provider value is returned by this check.",
      "Remote configuration and real-inbox verification require separate founder approval.",
    ]),
  });
}
