/**
 * GitHub Actions secret masking.
 *
 * The wrapper never prints secret values. When it runs inside GitHub Actions
 * with `--github-mask`, it registers the secret values it parsed via the
 * sanctioned `::add-mask::` workflow command, so any later accidental echo is
 * masked by the runner. Outside GitHub Actions the helper is a no-op.
 */

export const GITHUB_MASK_ENABLED_ENV = "GITHUB_ACTIONS";

/**
 * Emits `::add-mask::<value>` for each non-trivial value when running in GitHub
 * Actions. Returns the number of values masked. Values shorter than 4 chars are
 * skipped (masking them would hide ordinary log text).
 */
export function emitGithubMasks(
  values: readonly string[],
  env: NodeJS.ProcessEnv,
  out: (text: string) => void,
): number {
  if (env[GITHUB_MASK_ENABLED_ENV] !== "true") return 0;
  let masked = 0;
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string" || value.trim().length < 4) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out(`::add-mask::${value}\n`);
    masked += 1;
  }
  return masked;
}
