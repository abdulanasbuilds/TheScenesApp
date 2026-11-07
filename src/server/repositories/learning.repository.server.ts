import "@tanstack/react-start/server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";

export type EnrollmentRow = Readonly<{
  id: string;
  courseId: string;
  status: string;
  enrolledAt: string;
}>;

export type CompletionRow = Readonly<{
  lessonId: string;
  courseId: string;
  completedAt: string;
}>;

export class LearningRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findOwnEnrollments(userId: string): Promise<EnrollmentRow[]> {
    const { data, error } = await this.client
      .from("course_enrollments")
      .select("id, course_id, status, enrolled_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      courseId: row.course_id,
      status: row.status,
      enrolledAt: row.enrolled_at,
    }));
  }

  async findOwnCompletions(userId: string): Promise<CompletionRow[]> {
    // Query completions via join with enrollments to scope to this user
    const { data, error } = await this.client
      .from("lesson_completions")
      .select("lesson_id, course_id, completed_at, course_enrollments!inner(user_id, status)")
      .eq("course_enrollments.user_id", userId)
      .eq("course_enrollments.status", "active")
      .limit(500);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      lessonId: row.lesson_id,
      courseId: row.course_id,
      completedAt: row.completed_at,
    }));
  }

  async enrolInCourse(
    courseId: string,
    requestId: string,
  ): Promise<{ ok: boolean; changed: boolean; code?: string }> {
    const { data, error } = await this.client.rpc("enrol_in_course", {
      p_course_id: courseId,
      p_request_id: requestId,
    });
    if (error) throw error;
    const result = data as { ok: boolean; changed: boolean; code?: string };
    return { ok: result.ok, changed: result.changed, code: result.code };
  }

  async completeLesson(
    lessonId: string,
    requestId: string,
  ): Promise<{
    ok: boolean;
    changed: boolean;
    progressPercent?: number;
    learningStatus?: string;
    code?: string;
  }> {
    const { data, error } = await this.client.rpc("complete_lesson", {
      p_lesson_id: lessonId,
      p_request_id: requestId,
    });
    if (error) throw error;
    const result = data as {
      ok: boolean;
      changed: boolean;
      progressPercent?: number;
      learningStatus?: string;
      code?: string;
    };
    return {
      ok: result.ok,
      changed: result.changed,
      progressPercent: result.progressPercent,
      learningStatus: result.learningStatus,
      code: result.code,
    };
  }
}
