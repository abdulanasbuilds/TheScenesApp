/**
 * Supabase admin client — uses the service-role key to bypass RLS.
 *
 * SERVER-SIDE ONLY. Never import this in client code.
 * The service-role key is read from env.ts which reads process.env.
 *
 * Usage inside createServerFn handlers:
 *   const db = getAdminDb();
 *   const { data, error } = await db.from("payment_transactions").insert(...);
 */

// We use raw fetch against the Supabase REST API to avoid bundling
// @supabase/supabase-js in the server bundle with service-role credentials.
// This also makes it easy to audit — every call is a plain HTTP request.

function getConfig() {
  const url = process.env.VITE_SUPABASE_URL;
  // Accept both key names (transition period)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "[supabase-admin] VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. " +
      "These are server-only variables — never expose in the browser."
    );
  }
  return { url, key };
}

type SupabaseRow = Record<string, unknown>;
type SupabaseResponse<T> = { data: T | null; error: { message: string } | null };

// ─── Minimal REST client ──────────────────────────────────────────────────────

async function adminFetch<T = SupabaseRow[]>(
  path: string,
  options: RequestInit = {}
): Promise<SupabaseResponse<T>> {
  const { url, key } = getConfig();
  const headers: HeadersInit = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...options.headers,
  };

  const res = await fetch(`${url}/rest/v1${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const message = tryParseErrorMessage(body) ?? `HTTP ${res.status}`;
    console.error(`[supabase-admin] ${options.method ?? "GET"} ${path} → ${res.status}: ${message}`);
    return { data: null, error: { message } };
  }

  if (res.status === 204) {
    return { data: null, error: null };
  }

  const data = await res.json() as T;
  return { data, error: null };
}

function tryParseErrorMessage(body: string): string | null {
  try {
    const obj = JSON.parse(body) as { message?: string };
    return obj.message ?? null;
  } catch {
    return body || null;
  }
}

function qs(params: Record<string, string>): string {
  const parts = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const adminDb = {
  /** SELECT rows with optional filter (e.g. "email=eq.foo@bar.com"). */
  async select<T = SupabaseRow>(table: string, filter?: Record<string, string>): Promise<SupabaseResponse<T[]>> {
    const q = filter ? qs(filter) : "";
    return adminFetch<T[]>(`/${table}${q}`);
  },

  /** SELECT single row. */
  async selectOne<T = SupabaseRow>(table: string, filter: Record<string, string>): Promise<SupabaseResponse<T>> {
    const q = qs(filter);
    return adminFetch<T>(`/${table}${q}`, {
      headers: { Accept: "application/vnd.pgrst.object+json", Prefer: "return=representation" },
    });
  },

  /** INSERT a row. */
  async insert<T = SupabaseRow>(table: string, row: SupabaseRow): Promise<SupabaseResponse<T>> {
    return adminFetch<T>(`/${table}`, {
      method: "POST",
      body: JSON.stringify(row),
    });
  },

  /** UPDATE matching rows. */
  async update<T = SupabaseRow>(table: string, filter: Record<string, string>, patch: SupabaseRow): Promise<SupabaseResponse<T[]>> {
    const q = qs(filter);
    return adminFetch<T[]>(`/${table}${q}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  /** UPSERT (insert or update on conflict). */
  async upsert<T = SupabaseRow>(table: string, row: SupabaseRow, onConflict?: string): Promise<SupabaseResponse<T>> {
    const prefer = `return=representation${onConflict ? `,resolution=merge-duplicates` : ""}`;
    return adminFetch<T>(`/${table}`, {
      method: "POST",
      body: JSON.stringify(row),
      headers: { Prefer: prefer },
    });
  },

  /** DELETE matching rows. */
  async delete(table: string, filter: Record<string, string>): Promise<SupabaseResponse<null>> {
    const q = qs(filter);
    return adminFetch<null>(`/${table}${q}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  },

  /** Run a raw RPC function. */
  async rpc<T = unknown>(fn: string, args: SupabaseRow = {}): Promise<SupabaseResponse<T>> {
    return adminFetch<T>(`/rpc/${fn}`, {
      method: "POST",
      body: JSON.stringify(args),
    });
  },
};
