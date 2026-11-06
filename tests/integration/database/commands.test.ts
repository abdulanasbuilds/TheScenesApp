/**
 * Phase 3A Wave 1 database integration tests.
 *
 * These run against the loopback-only local Supabase stack and exercise the real
 * Data API/Auth/RPC surface: signup, direct-table denial, the public happy path,
 * cross-user isolation, and concurrent commands.
 *
 * The suite skips when no local-stack configuration is present. Supply:
 *   PHASE3_API_URL=http://127.0.0.1:54321
 *   PHASE3_PUBLISHABLE_KEY=<publishable key from `phase3:stack:status`>
 *
 * The suite refuses any non-loopback URL.
 */

import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, test } from "bun:test";

const PDS_COMMUNITY = "40000000-0000-4000-8000-000000000001";
const AIBG_COMMUNITY = "40000000-0000-4000-8000-000000000002";
const PDS_COURSE = "50000000-0000-4000-8000-000000000001";

const PDS_LESSONS = [
  "80000000-0000-4000-8000-000000000001",
  "80000000-0000-4000-8000-000000000002",
  "80000000-0000-4000-8000-000000000003",
  "80000000-0000-4000-8000-000000000004",
] as const;

const PASSWORD = "local-test-password-123";

interface LocalStackConfig {
  url: string;
  key: string;
}

function readConfig(): LocalStackConfig | null {
  const url = process.env.PHASE3_API_URL ?? process.env.SUPABASE_URL ?? "";
  const key =
    process.env.PHASE3_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    "";
  if (!url || !key) return null;
  if (!/^https?:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(url)) {
    throw new Error("refusing to run database integration tests against a non-loopback URL");
  }
  return { url, key };
}

const config = readConfig();
const suite = config ? describe : describe.skip;

function newClient(): SupabaseClient {
  if (!config) throw new Error("local stack configuration is missing");
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-phase3-test": "database" } },
  });
}

interface Learner {
  client: SupabaseClient;
  userId: string;
  email: string;
}

let learnerCounter = 0;

async function createLearner(): Promise<Learner> {
  learnerCounter += 1;
  const suffix = `${Date.now().toString(36)}${learnerCounter}`.slice(-10);
  const email = `phase3.int.${suffix}@test.invalid`;
  const handle = `int${suffix}`;
  const client = newClient();
  const { data, error } = await client.auth.signUp({
    email,
    password: PASSWORD,
    options: { data: { handle, display_name: `Integration Learner ${learnerCounter}` } },
  });
  if (error) throw new Error(`signup failed: ${error.message}`);
  if (!data.session || !data.user) {
    throw new Error("signup did not return a session; local email confirmations must be disabled");
  }
  return { client, userId: data.user.id, email };
}

async function join(client: SupabaseClient, communityId = PDS_COMMUNITY) {
  return client.rpc("join_community", {
    p_community_id: communityId,
    p_request_id: randomUUID(),
  });
}

async function enrol(client: SupabaseClient, courseId = PDS_COURSE) {
  return client.rpc("enrol_in_course", {
    p_course_id: courseId,
    p_request_id: randomUUID(),
  });
}

async function complete(client: SupabaseClient, lessonId: string) {
  return client.rpc("complete_lesson", {
    p_lesson_id: lessonId,
    p_request_id: randomUUID(),
  });
}

suite("database integration", () => {
  test("catalogue actors cannot sign in", async () => {
    const client = newClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: "nadia.okafor@catalogue.invalid",
      password: "not-the-seed-password",
    });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });

  test("anonymous clients cannot execute commands or read protected tables", async () => {
    const client = newClient();

    const command = await join(client);
    expect(command.error).not.toBeNull();

    const enrolments = await client.from("course_enrollments").select("id");
    expect(enrolments.error).not.toBeNull();

    const audit = await client.schema("private").from("audit_events").select("id");
    expect(audit.error).not.toBeNull();
  });

  test("direct table writes are denied; only granted profile columns are writable", async () => {
    const learner = await createLearner();

    const membership = await learner.client.from("community_memberships").insert({
      community_id: PDS_COMMUNITY,
      user_id: learner.userId,
      role: "member",
      status: "active",
      joined_at: new Date().toISOString(),
    });
    expect(membership.error).not.toBeNull();

    const enrolment = await learner.client.from("course_enrollments").insert({
      course_id: PDS_COURSE,
      user_id: learner.userId,
      status: "active",
      source: "self",
    });
    expect(enrolment.error).not.toBeNull();

    const handleWrite = await learner.client
      .from("profiles")
      .update({ handle: "hackedhandle" })
      .eq("id", learner.userId);
    expect(handleWrite.error).not.toBeNull();

    const allowedWrite = await learner.client
      .from("profiles")
      .update({ display_name: "Integration Renamed" })
      .eq("id", learner.userId)
      .select("display_name");
    expect(allowedWrite.error).toBeNull();
    expect(allowedWrite.data).toEqual([{ display_name: "Integration Renamed" }]);

    await learner.client.auth.signOut();
  });

  test("missing request ids are rejected by the command functions", async () => {
    const learner = await createLearner();

    const missing = await learner.client.rpc("join_community", {
      p_community_id: PDS_COMMUNITY,
    });
    expect(missing.error).not.toBeNull();

    const nullId = await learner.client.rpc("join_community", {
      p_community_id: PDS_COMMUNITY,
      p_request_id: null,
    });
    expect(nullId.error).not.toBeNull();

    await learner.client.auth.signOut();
  });

  test("public happy path: preview, join, enrol, protect, complete", async () => {
    const learner = await createLearner();

    const preview = await learner.client.from("lesson_contents").select("lesson_id");
    expect(preview.error).toBeNull();
    expect(preview.data?.map((row) => row.lesson_id).sort()).toEqual(
      ["80000000-0000-4000-8000-000000000001", "80000000-0000-4000-8000-000000000005"].sort(),
    );

    const firstJoin = await join(learner.client);
    expect(firstJoin.error).toBeNull();
    expect(firstJoin.data?.ok).toBe(true);
    expect(firstJoin.data?.changed).toBe(true);

    const secondJoin = await join(learner.client);
    expect(secondJoin.error).toBeNull();
    expect(secondJoin.data?.changed).toBe(false);

    const privateJoin = await join(learner.client, AIBG_COMMUNITY);
    expect(privateJoin.error).toBeNull();
    expect(privateJoin.data).toEqual(expect.objectContaining({ ok: false, code: "not_found" }));

    const firstEnrol = await enrol(learner.client);
    expect(firstEnrol.error).toBeNull();
    expect(firstEnrol.data?.changed).toBe(true);

    const secondEnrol = await enrol(learner.client);
    expect(secondEnrol.error).toBeNull();
    expect(secondEnrol.data?.changed).toBe(false);

    const protectedContent = await learner.client.from("lesson_contents").select("lesson_id");
    expect(protectedContent.error).toBeNull();
    expect(protectedContent.data).toHaveLength(5);

    const firstCompletion = await complete(learner.client, PDS_LESSONS[1]);
    expect(firstCompletion.error).toBeNull();
    expect(firstCompletion.data).toEqual(
      expect.objectContaining({ ok: true, changed: true, learningStatus: "in-progress" }),
    );

    const duplicate = await complete(learner.client, PDS_LESSONS[1]);
    expect(duplicate.error).toBeNull();
    expect(duplicate.data?.changed).toBe(false);

    for (const lessonId of [PDS_LESSONS[0], PDS_LESSONS[2], PDS_LESSONS[3]]) {
      const result = await complete(learner.client, lessonId);
      expect(result.error).toBeNull();
      expect(result.data?.ok).toBe(true);
    }

    const finalCompletion = await complete(learner.client, PDS_LESSONS[3]);
    expect(finalCompletion.error).toBeNull();
    expect(finalCompletion.data).toEqual(
      expect.objectContaining({
        learningStatus: "completed",
        completedLessons: 4,
        totalLessons: 4,
        progressPercent: 100,
      }),
    );

    await learner.client.auth.signOut();
  });

  test("cross-user isolation: learner B cannot see learner A history", async () => {
    const learnerA = await createLearner();
    const learnerB = await createLearner();

    expect((await join(learnerA.client)).error).toBeNull();
    expect((await enrol(learnerA.client)).error).toBeNull();
    expect((await complete(learnerA.client, PDS_LESSONS[1])).error).toBeNull();

    const memberships = await learnerB.client.from("community_memberships").select("id");
    expect(memberships.error).toBeNull();
    expect(memberships.data).toEqual([]);

    const enrolments = await learnerB.client.from("course_enrollments").select("id");
    expect(enrolments.error).toBeNull();
    expect(enrolments.data).toEqual([]);

    const completions = await learnerB.client.from("lesson_completions").select("id");
    expect(completions.error).toBeNull();
    expect(completions.data).toEqual([]);

    const denial = await complete(learnerB.client, PDS_LESSONS[1]);
    expect(denial.error).toBeNull();
    expect(denial.data).toEqual(expect.objectContaining({ ok: false, code: "forbidden" }));

    await learnerA.client.auth.signOut();
    await learnerB.client.auth.signOut();
  });

  test("concurrent commands produce exactly one state transition", async () => {
    const learner = await createLearner();

    const joins = await Promise.all(Array.from({ length: 20 }, () => join(learner.client)));
    for (const result of joins) expect(result.error).toBeNull();
    expect(joins.filter((result) => result.data?.changed === true)).toHaveLength(1);
    expect(joins.filter((result) => result.data?.ok === true)).toHaveLength(20);

    const enrolments = await Promise.all(Array.from({ length: 20 }, () => enrol(learner.client)));
    for (const result of enrolments) expect(result.error).toBeNull();
    expect(enrolments.filter((result) => result.data?.changed === true)).toHaveLength(1);

    const completions = await Promise.all(
      Array.from({ length: 20 }, () => complete(learner.client, PDS_LESSONS[1])),
    );
    for (const result of completions) expect(result.error).toBeNull();
    expect(completions.filter((result) => result.data?.changed === true)).toHaveLength(1);
    expect(completions.filter((result) => result.data?.ok === true)).toHaveLength(20);

    const final = await complete(learner.client, PDS_LESSONS[1]);
    expect(final.error).toBeNull();
    expect(final.data).toEqual(
      expect.objectContaining({
        changed: false,
        completedLessons: 1,
        totalLessons: 4,
        progressPercent: 25,
      }),
    );

    await learner.client.auth.signOut();
  });
});
