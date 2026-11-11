import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PAGE_MAX,
  NOTIFICATION_PAGE_SIZE,
  notificationHrefSchema,
  notificationItemSchema,
  notificationPreferencesSchema,
  type NotificationPreferences,
} from "../../src/features/notifications/contracts";
import {
  buildNotificationKeysetFilter,
  decodeNotificationCursor,
  encodeNotificationCursor,
} from "../../src/features/notifications/cursor";
import {
  markNotificationReadSchema,
  notificationListSchema,
  notificationPreferencesUpdateSchema,
} from "../../src/features/notifications/schemas";
import { NotificationRepository } from "../../src/server/repositories/notification.repository.server";

const MIGRATION = readFileSync(
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../supabase/migrations/20261111120000_phase4_0019_notifications.sql",
  ),
  "utf8",
);

const USER_ID = "11111111-1111-4111-8111-111111111111";
const NOTIFICATION_ID = "22222222-2222-4222-8222-222222222222";
const CREATED_AT = "2026-11-11T09:30:00.000Z";

type FakeResult = Readonly<{
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
}>;

/** Minimal thenable stand-in for a PostgREST query builder that records the calls it receives. */
class FakeQuery implements PromiseLike<FakeResult> {
  readonly calls: string[] = [];

  constructor(private readonly result: FakeResult) {}

  private record(name: string, args: readonly unknown[]): this {
    this.calls.push(`${name}:${JSON.stringify(args)}`);
    return this;
  }

  select(...args: unknown[]): this {
    return this.record("select", args);
  }
  eq(...args: unknown[]): this {
    return this.record("eq", args);
  }
  is(...args: unknown[]): this {
    return this.record("is", args);
  }
  or(...args: unknown[]): this {
    return this.record("or", args);
  }
  order(...args: unknown[]): this {
    return this.record("order", args);
  }
  limit(...args: unknown[]): this {
    return this.record("limit", args);
  }
  update(...args: unknown[]): this {
    return this.record("update", args);
  }
  upsert(...args: unknown[]): this {
    return this.record("upsert", args);
  }

  async maybeSingle(): Promise<FakeResult> {
    this.calls.push("maybeSingle");
    return this.result;
  }

  async single(): Promise<FakeResult> {
    this.calls.push("single");
    return this.result;
  }

  then<TResult1 = FakeResult, TResult2 = never>(
    onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

function fakeClient(result: FakeResult): {
  client: SupabaseClient<Database>;
  query: FakeQuery;
} {
  const query = new FakeQuery(result);
  const client = {
    from(table: string) {
      query.calls.push(`from:${table}`);
      return query;
    },
  } as unknown as SupabaseClient<Database>;
  return { client, query };
}

function notificationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: NOTIFICATION_ID,
    type: "community_joined",
    title: "You joined AI Builders Guild",
    body: "Your membership is active.",
    href: "/c/ai-builders-guild",
    read_at: null,
    created_at: CREATED_AT,
    ...overrides,
  };
}

function preferenceRow(overrides: Record<string, unknown> = {}) {
  return {
    in_app_learning: true,
    in_app_community: true,
    in_app_product: true,
    email_learning: false,
    email_community: false,
    email_product: false,
    push_learning: false,
    push_community: false,
    push_product: false,
    ...overrides,
  };
}

describe("P4-S3 href allowlist", () => {
  test("accepts the approved internal route families", () => {
    for (const href of [
      "/home",
      "/my-learning",
      "/notifications",
      "/settings",
      "/c/ai-builders-guild",
      "/c/ai-builders-guild/classroom/ship-your-first-ai-agent",
    ]) {
      expect(notificationHrefSchema.safeParse(href).success).toBe(true);
    }
  });

  test("rejects absolute, protocol-relative and unapproved paths", () => {
    for (const href of [
      "https://evil.example/steal",
      "//evil.example",
      "http://127.0.0.1/home",
      "/admin",
      "/c/../settings",
      "/c/UPPER/case",
      "notifications",
      "/c/ai-builders-guild/classroom",
      "",
      `/${"a".repeat(201)}`,
    ]) {
      expect(notificationHrefSchema.safeParse(href).success).toBe(false);
    }
  });

  test("marks read state from read_at and rejects an unknown type", () => {
    expect(
      notificationItemSchema.parse({
        id: NOTIFICATION_ID,
        type: "course_enrolled",
        title: "You enrolled",
        body: "Lessons are ready.",
        href: null,
        read: true,
        createdAt: CREATED_AT,
      }),
    ).toMatchObject({ read: true, type: "course_enrolled" });

    expect(
      notificationItemSchema.safeParse({
        id: NOTIFICATION_ID,
        type: "comment_mention",
        title: "x",
        body: "y",
        href: null,
        read: false,
        createdAt: CREATED_AT,
      }).success,
    ).toBe(false);
  });
});

describe("P4-S3 preferences contract", () => {
  test("safely defaults in-app categories on and email/push off", () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES).toEqual({
      inAppLearning: true,
      inAppCommunity: true,
      inAppProduct: true,
      emailLearning: false,
      emailCommunity: false,
      emailProduct: false,
      pushLearning: false,
      pushCommunity: false,
      pushProduct: false,
    });
    expect(Object.isFrozen(DEFAULT_NOTIFICATION_PREFERENCES)).toBe(true);
  });

  test("requires exactly the nine explicit boolean columns", () => {
    expect(notificationPreferencesSchema.safeParse(DEFAULT_NOTIFICATION_PREFERENCES).success).toBe(
      true,
    );
    expect(
      notificationPreferencesUpdateSchema.safeParse(DEFAULT_NOTIFICATION_PREFERENCES).success,
    ).toBe(true);
    expect(
      notificationPreferencesUpdateSchema.safeParse({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        adminOverride: true,
      }).success,
    ).toBe(false);
    const incomplete = { ...DEFAULT_NOTIFICATION_PREFERENCES } as Partial<NotificationPreferences>;
    delete incomplete.inAppProduct;
    expect(notificationPreferencesSchema.safeParse(incomplete).success).toBe(false);
  });
});

describe("P4-S3 keyset cursor", () => {
  test("round-trips an encoded cursor", () => {
    const cursor = { createdAt: CREATED_AT, id: NOTIFICATION_ID };
    const encoded = encodeNotificationCursor(cursor);
    expect(encoded).toBe(`${CREATED_AT}|${NOTIFICATION_ID}`);
    expect(decodeNotificationCursor(encoded)).toEqual(cursor);
  });

  test("rejects malformed cursors instead of trusting them", () => {
    for (const value of [
      "",
      "no-separator",
      `|${NOTIFICATION_ID}`,
      `${CREATED_AT}|`,
      `${CREATED_AT}|not-a-uuid`,
      "not-a-date|" + NOTIFICATION_ID,
      ` ${CREATED_AT}|${NOTIFICATION_ID}`,
    ]) {
      expect(decodeNotificationCursor(value)).toBeNull();
    }
  });

  test("accepts an offset timestamp and builds a quoted keyset filter", () => {
    const cursor = { createdAt: "2026-11-11T12:00:00+02:00", id: NOTIFICATION_ID };
    expect(decodeNotificationCursor(encodeNotificationCursor(cursor))).toEqual(cursor);
    expect(buildNotificationKeysetFilter(cursor)).toBe(
      `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt."${cursor.id}")`,
    );
  });
});

describe("P4-S3 list input schema", () => {
  test("applies the documented defaults", () => {
    expect(notificationListSchema.parse({})).toEqual({
      filter: "all",
      cursor: null,
      limit: NOTIFICATION_PAGE_SIZE,
    });
    expect(NOTIFICATION_PAGE_SIZE).toBe(20);
    expect(NOTIFICATION_PAGE_MAX).toBe(50);
  });

  test("decodes a valid cursor and rejects an invalid one as a field error", () => {
    const parsed = notificationListSchema.parse({
      filter: "unread",
      cursor: `${CREATED_AT}|${NOTIFICATION_ID}`,
      limit: NOTIFICATION_PAGE_MAX,
    });
    expect(parsed).toEqual({
      filter: "unread",
      cursor: { createdAt: CREATED_AT, id: NOTIFICATION_ID },
      limit: 50,
    });

    const invalid = notificationListSchema.safeParse({ cursor: "tampered" });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues.some((issue) => issue.path.includes("cursor"))).toBe(true);
    }
  });

  test("rejects out-of-range limits and unknown keys", () => {
    expect(notificationListSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(notificationListSchema.safeParse({ limit: NOTIFICATION_PAGE_MAX + 1 }).success).toBe(
      false,
    );
    expect(
      notificationListSchema.safeParse({ limit: NOTIFICATION_PAGE_SIZE, extra: true }).success,
    ).toBe(false);
    expect(notificationListSchema.safeParse({ filter: "archived" }).success).toBe(false);
    expect(markNotificationReadSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });
});

describe("P4-S3 repository mapping and ownership", () => {
  test("maps rows, reports hasMore, and always filters by the caller", async () => {
    const rows = Array.from({ length: NOTIFICATION_PAGE_SIZE + 1 }, (_, index) =>
      notificationRow({
        id: `${(0x22222220 + index).toString(16)}-2222-4222-8222-222222222222`,
        read_at: index === 0 ? null : CREATED_AT,
      }),
    );
    const { client, query } = fakeClient({ data: rows, error: null });
    const page = await new NotificationRepository(client).listOwn(USER_ID, {
      filter: "all",
      limit: NOTIFICATION_PAGE_SIZE,
      cursor: null,
    });

    expect(page.hasMore).toBe(true);
    expect(page.items).toHaveLength(NOTIFICATION_PAGE_SIZE);
    expect(page.items[0]).toMatchObject({ read: false, href: "/c/ai-builders-guild" });
    expect(page.items[1]).toMatchObject({ read: true });
    expect(query.calls).toContain(`eq:["user_id","${USER_ID}"]`);
    expect(query.calls).toContain(`limit:[${NOTIFICATION_PAGE_SIZE + 1}]`);
  });

  test("adds the unread filter and the keyset filter only when requested", async () => {
    const unread = fakeClient({ data: [], error: null });
    await new NotificationRepository(unread.client).listOwn(USER_ID, {
      filter: "unread",
      limit: NOTIFICATION_PAGE_SIZE,
      cursor: null,
    });
    expect(unread.query.calls).toContain('is:["read_at",null]');
    expect(unread.query.calls.some((call) => call.startsWith("or:"))).toBe(false);

    const cursor = { createdAt: CREATED_AT, id: NOTIFICATION_ID };
    const paged = fakeClient({ data: [], error: null });
    await new NotificationRepository(paged.client).listOwn(USER_ID, {
      filter: "all",
      limit: NOTIFICATION_PAGE_SIZE,
      cursor,
    });
    expect(paged.query.calls).toContain(
      `or:[${JSON.stringify(buildNotificationKeysetFilter(cursor))}]`,
    );
  });

  test("counts unread with a head-only query and marks only unread rows", async () => {
    const counted = fakeClient({ count: 3, data: null, error: null });
    expect(await new NotificationRepository(counted.client).countUnread(USER_ID)).toBe(3);
    expect(counted.query.calls).toContain('select:["id",{"count":"exact","head":true}]');
    expect(counted.query.calls).toContain('is:["read_at",null]');

    const marked = fakeClient({ data: [{ id: NOTIFICATION_ID }], error: null });
    const changed = await new NotificationRepository(marked.client).markRead(
      USER_ID,
      NOTIFICATION_ID,
      CREATED_AT,
    );
    expect(changed).toBe(1);
    expect(marked.query.calls).toContain(`eq:["id","${NOTIFICATION_ID}"]`);
    expect(marked.query.calls).toContain(`update:[{"read_at":"${CREATED_AT}"}]`);
    expect(marked.query.calls).toContain('is:["read_at",null]');
  });

  test("returns safe defaults when no preference row exists and maps a stored row", async () => {
    const missing = fakeClient({ data: null, error: null });
    expect(await new NotificationRepository(missing.client).readPreferences(USER_ID)).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );

    const stored = fakeClient({
      data: preferenceRow({ email_learning: true, push_community: true }),
      error: null,
    });
    expect(await new NotificationRepository(stored.client).readPreferences(USER_ID)).toEqual({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      emailLearning: true,
      pushCommunity: true,
    });

    const upserted = fakeClient({ data: preferenceRow({ in_app_product: false }), error: null });
    const result = await new NotificationRepository(upserted.client).upsertPreferences(USER_ID, {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      inAppProduct: false,
    });
    expect(result.inAppProduct).toBe(false);
    expect(
      upserted.query.calls.some(
        (call) => call.startsWith("upsert:") && call.includes('"onConflict":"user_id"'),
      ),
    ).toBe(true);
  });
});

describe("P4-S3 migration contract (static, replaces the local DB gate until Docker is available)", () => {
  test("creates owner-scoped tables with the approved columns", () => {
    expect(MIGRATION).toContain("create table public.notifications");
    expect(MIGRATION).toContain("create table public.notification_preferences");
    expect(MIGRATION).toContain(
      "user_id uuid not null references auth.users (id) on delete cascade",
    );
    expect(MIGRATION).toContain(
      "check (type in ('community_joined', 'course_enrolled', 'lesson_completed', 'system'))",
    );
    expect(MIGRATION).toContain("char_length(btrim(title)) between 1 and 120");
    expect(MIGRATION).toContain("char_length(btrim(body)) between 1 and 500");
    expect(MIGRATION).toContain("char_length(dedupe_key) between 1 and 160");
  });

  test("enforces the internal href allowlist in the database", () => {
    expect(MIGRATION).toContain("notifications_href_format");
    expect(MIGRATION).toContain("(?:home|my-learning|notifications|settings|c/");
  });

  test("enables RLS, denies anon, and grants only column-scoped client access", () => {
    expect(MIGRATION).toContain("alter table public.notifications enable row level security");
    expect(MIGRATION).toContain(
      "alter table public.notification_preferences enable row level security",
    );
    expect(MIGRATION).not.toMatch(/grant\s+[^;]*\bto\s+anon/i);
    expect(MIGRATION).not.toMatch(/grant\s+insert[^;]*on public\.notifications/i);
    expect(MIGRATION).toContain(
      "grant select (id, user_id, type, title, body, href, read_at, created_at)",
    );
    expect(MIGRATION).toContain("grant update (read_at) on public.notifications to authenticated");
    expect(MIGRATION).toContain(
      "grant insert (\n  user_id, in_app_learning, in_app_community, in_app_product,",
    );
  });

  test("keeps every policy owner-only", () => {
    for (const policy of [
      "notifications_select_own",
      "notifications_update_own",
      "notification_preferences_select_own",
      "notification_preferences_insert_own",
      "notification_preferences_update_own",
    ]) {
      expect(MIGRATION).toContain(`create policy ${policy}`);
    }
    expect(MIGRATION).toContain("using (user_id = (select auth.uid()))");
    expect(MIGRATION).toContain("with check (user_id = (select auth.uid()))");
  });

  test("defines the keyset and dedupe indexes", () => {
    expect(MIGRATION).toContain("create unique index notifications_user_dedupe_key");
    expect(MIGRATION).toContain("on public.notifications (user_id, dedupe_key)");
    expect(MIGRATION).toContain("on public.notifications (user_id, created_at desc, id desc)");
    expect(MIGRATION).toContain("where read_at is null");
  });

  test("generates notifications atomically from the audit trigger with a stable dedupe key", () => {
    expect(MIGRATION).toContain("create trigger audit_events_create_notification");
    expect(MIGRATION).toContain("after insert on private.audit_events");
    expect(MIGRATION).toContain(
      "create or replace function private.create_notification_from_audit_event()",
    );
    expect(MIGRATION).toContain("security definer");
    expect(MIGRATION).toContain("set search_path = ''");
    expect(MIGRATION).toContain(
      "revoke all on function private.create_notification_from_audit_event()",
    );
    expect(MIGRATION).toContain("'audit:' || new.id::text");
    expect(MIGRATION).toContain("on conflict (user_id, dedupe_key) do nothing");
  });

  test("emits only the approved default-on events and honours preferences", () => {
    expect(MIGRATION).toContain("new.action = 'community.joined'");
    expect(MIGRATION).toContain("new.action = 'course.enrolled'");
    expect(MIGRATION).not.toContain("new.action = 'lesson.completed'");
    expect(MIGRATION).toContain("coalesce(p.in_app_community, true)");
    expect(MIGRATION).toContain("coalesce(p.in_app_learning, true)");
  });

  test("defaults in-app on and email/push off", () => {
    for (const column of ["in_app_learning", "in_app_community", "in_app_product"]) {
      expect(MIGRATION).toContain(`${column} boolean not null default true`);
    }
    for (const column of [
      "email_learning",
      "email_community",
      "email_product",
      "push_learning",
      "push_community",
      "push_product",
    ]) {
      expect(MIGRATION).toContain(`${column} boolean not null default false`);
    }
  });

  test("does not introduce a neutral preference column that could suppress mandatory mail", () => {
    expect(MIGRATION).not.toMatch(/email_account|push_account|in_app_account|account_notices/i);
  });
});

describe("P4-S3 safe error surface", () => {
  test("no provider detail is exposed through the notification contracts", () => {
    const preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
    expect(JSON.stringify(preferences)).not.toContain("token");
    expect(JSON.stringify(preferences)).not.toContain("key");
  });
});
