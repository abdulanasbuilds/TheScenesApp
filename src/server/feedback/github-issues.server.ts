import "@tanstack/react-start/server-only";
import {
  FEEDBACK_AREA_LABELS,
  FEEDBACK_CATEGORY_GITHUB_LABEL,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_CATEGORY_TITLE_PREFIX,
} from "../../features/feedback/contracts";
import {
  FeedbackProviderError,
  type FeedbackMessage,
  type FeedbackProvider,
  type FeedbackResult,
} from "./feedback-provider.server";

/**
 * GitHub Issues feedback adapter (P4-S4 / ADR-049).
 *
 * A submission becomes a single Issue in the private `thescenes-feedback` repository through the
 * official GitHub REST API. GitHub Issues is the founder's management interface: there is no feedback
 * database, no Supabase table and no separate owner dashboard.
 *
 * Integrity rules:
 * - The fine-grained token lives only in the server runtime environment. It is never logged, returned
 *   to the browser or embedded in an Issue body.
 * - A message is reported as delivered only after GitHub answers with HTTP 201 and an issue number.
 * - `submissionId` is written into the body as an HTML-comment marker. Before creating, the adapter
 *   lists the most recent issues and reuses an existing one for the same marker, so a retry after a
 *   lost response does not create a duplicate.
 * - Failures are classified for logs only. The public contract stays a single honest "try again"
 *   message; no GitHub status code, repository name or token detail is exposed.
 */

const DEFAULT_API_BASE = "https://api.github.com";
const DEFAULT_TIMEOUT_MS = 8000;
const GITHUB_API_VERSION = "2022-11-28";
const MAX_DEDUPE_PAGE = 100;

export type GitHubIssuesConfig = Readonly<{
  owner: string;
  repo: string;
  token: string;
  apiBase?: string;
  timeoutMs?: number;
  /** Injection point for tests; production always uses the runtime `fetch`. */
  fetchImpl?: typeof fetch;
}>;

/** The marker embedded in every issue body. Exported so tests and the setup runbook can rely on it. */
export function feedbackSubmissionMarker(submissionId: string): string {
  return `<!-- thescenes-submission:${submissionId} -->`;
}

/** Collapse an issue-title-safe single line: no control characters, no newlines, bounded length. */
function sanitizeTitlePart(value: string): string {
  let stripped = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    stripped += code < 32 || code === 127 ? " " : char;
  }
  return stripped.replace(/\s+/g, " ").trim();
}

function buildIssueTitle(message: FeedbackMessage): string {
  const prefix = FEEDBACK_CATEGORY_TITLE_PREFIX[message.category];
  const subject = sanitizeTitlePart(message.subject).slice(0, 120) || "Feedback";
  return `[${prefix}] ${subject}`;
}

function buildIssueBody(message: FeedbackMessage): string {
  const rows: string[] = [
    "### Feedback from The Scenes",
    "",
    `- **Category:** ${FEEDBACK_CATEGORY_LABELS[message.category]}`,
  ];
  if (message.area) rows.push(`- **Area:** ${FEEDBACK_AREA_LABELS[message.area]}`);
  rows.push(`- **Page:** \`${message.route}\``);
  rows.push(`- **Role:** ${message.role === "member" ? "Signed-in member" : "Guest"}`);
  if (message.pseudonymousUserId) {
    rows.push(`- **User reference (internal):** \`${message.pseudonymousUserId}\``);
  }
  rows.push(`- **Submitted:** ${message.occurredAt}`);
  rows.push(`- **Request:** \`${message.requestId}\``);
  rows.push("", "---", "", message.text, "", "---", feedbackSubmissionMarker(message.submissionId));

  return rows.join("\n");
}

type GitHubIssue = Readonly<{ number?: unknown; body?: unknown; pull_request?: unknown }>;

async function request(
  config: Required<Pick<GitHubIssuesConfig, "apiBase" | "timeoutMs" | "fetchImpl">>,
  token: string,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    return await config.fetchImpl(`${config.apiBase}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": "thescenes-feedback",
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });
  } catch {
    // Network failure, DNS failure or the timeout abort. Never surface the underlying error.
    throw new FeedbackProviderError("network", "The GitHub API could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}

/** Map a non-2xx GitHub response to a classified, non-leaking provider error. */
function classify(response: Response): FeedbackProviderError {
  if (response.status === 401) {
    return new FeedbackProviderError("rejected", "GitHub rejected the feedback token.");
  }
  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (response.status === 429 || remaining === "0") {
      return new FeedbackProviderError("rate-limited", "The GitHub API rate limit was reached.");
    }
    return new FeedbackProviderError("rejected", "GitHub refused the feedback request.");
  }
  if (response.status === 404 || response.status === 410) {
    return new FeedbackProviderError(
      "configuration",
      "The feedback repository is missing, private to another account or has Issues disabled.",
    );
  }
  if (response.status >= 500) {
    return new FeedbackProviderError("unavailable", "The GitHub API is temporarily unavailable.");
  }
  return new FeedbackProviderError("rejected", "GitHub refused the feedback request.");
}

function parseIssueNumber(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as GitHubIssue).number;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export class GitHubIssuesFeedbackProvider implements FeedbackProvider {
  readonly kind = "github" as const;
  private readonly resolved: Required<
    Pick<GitHubIssuesConfig, "apiBase" | "timeoutMs" | "fetchImpl">
  >;
  private readonly owner: string;
  private readonly repo: string;
  private readonly token: string;

  constructor(config: GitHubIssuesConfig) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.token = config.token;
    this.resolved = {
      apiBase: (config.apiBase ?? DEFAULT_API_BASE).replace(/\/+$/, ""),
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      fetchImpl: config.fetchImpl ?? fetch,
    };
  }

  /**
   * Best-effort duplicate check. A lookup failure is not fatal: the common case is a fresh note with
   * no existing issue, and refusing to create would lose the submission entirely.
   */
  private async findExistingIssue(marker: string): Promise<number | null> {
    let response: Response;
    try {
      response = await request(
        this.resolved,
        this.token,
        `/repos/${this.owner}/${this.repo}/issues?state=all&per_page=${MAX_DEDUPE_PAGE}&sort=created&direction=desc`,
        { method: "GET" },
      );
    } catch {
      return null;
    }
    if (!response.ok) return null;

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return null;
    }
    if (!Array.isArray(payload)) return null;

    for (const entry of payload as GitHubIssue[]) {
      if (entry && typeof entry === "object" && "pull_request" in entry && entry.pull_request)
        continue;
      if (typeof entry.body === "string" && entry.body.includes(marker)) {
        const number = parseIssueNumber(entry);
        if (number !== null) return number;
      }
    }
    return null;
  }

  async submit(message: FeedbackMessage): Promise<FeedbackResult> {
    const marker = feedbackSubmissionMarker(message.submissionId);

    const existing = await this.findExistingIssue(marker);
    if (existing !== null) {
      return { delivery: "provider", reference: `github:${existing}` };
    }

    const response = await request(
      this.resolved,
      this.token,
      `/repos/${this.owner}/${this.repo}/issues`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: buildIssueTitle(message),
          body: buildIssueBody(message),
          labels: [FEEDBACK_CATEGORY_GITHUB_LABEL[message.category]],
        }),
      },
    );

    if (!response.ok) throw classify(response);

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new FeedbackProviderError("unavailable", "GitHub returned an unreadable response.");
    }

    const number = parseIssueNumber(payload);
    if (number === null) {
      throw new FeedbackProviderError("unavailable", "GitHub did not confirm an issue number.");
    }
    return { delivery: "provider", reference: `github:${number}` };
  }
}
