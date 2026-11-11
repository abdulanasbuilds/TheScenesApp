import "@tanstack/react-start/server-only";
import { applyPrivateNoStoreResponse } from "../http/errors.server";
import { LearningRepository } from "../repositories/learning.repository.server";
import { getVerifiedPrincipal } from "../supabase/auth.server";
import { createRequestSupabaseClient } from "../supabase/server-client.server";
import { PublicAppError } from "../../features/shared/safe-handler";
import { assertRateLimit, consumeRateLimit } from "../security/rate-limit.server";

export type EnrolResult = Readonly<{ changed: boolean }>;

export type CompleteLessonResult = Readonly<{
  changed: boolean;
  progressPercent?: number;
  learningStatus?: string;
}>;

export type LearningState = Readonly<{
  enrolledCourseIds: readonly string[];
  completedLessonIds: readonly string[];
}>;

export async function getLearningState(): Promise<LearningState> {
  applyPrivateNoStoreResponse();
  const principal = await getVerifiedPrincipal();
  if (!principal) return { enrolledCourseIds: [], completedLessonIds: [] };
  const client = createRequestSupabaseClient();
  const repo = new LearningRepository(client);
  const [enrollments, completions] = await Promise.all([
    repo.findOwnEnrollments(principal.userId),
    repo.findOwnCompletions(principal.userId),
  ]);
  return {
    enrolledCourseIds: enrollments.map((e) => e.courseId),
    completedLessonIds: completions.map((c) => c.lessonId),
  };
}

export async function enrolInCourse(courseId: string, requestId: string): Promise<EnrolResult> {
  applyPrivateNoStoreResponse();
  const principal = await getVerifiedPrincipal();
  if (!principal) throw new PublicAppError("UNAUTHENTICATED", "Sign in to enrol in a course.");
  assertRateLimit(
    await consumeRateLimit("course-enrol", principal.userId),
    "Please wait before enrolling in another course.",
  );
  const client = createRequestSupabaseClient();
  const result = await new LearningRepository(client).enrolInCourse(courseId, requestId);
  if (!result.ok) {
    if (result.code === "not_authenticated") {
      throw new PublicAppError("UNAUTHENTICATED", "Sign in to enrol in a course.");
    }
    throw new PublicAppError("NOT_FOUND", "Course not found or not available.");
  }
  return { changed: result.changed };
}

export async function completeLesson(
  lessonId: string,
  requestId: string,
): Promise<CompleteLessonResult> {
  applyPrivateNoStoreResponse();
  const principal = await getVerifiedPrincipal();
  if (!principal) throw new PublicAppError("UNAUTHENTICATED", "Sign in to record lesson progress.");
  assertRateLimit(
    await consumeRateLimit("lesson-complete", principal.userId),
    "Please wait before recording more progress.",
  );
  const client = createRequestSupabaseClient();
  const result = await new LearningRepository(client).completeLesson(lessonId, requestId);
  if (!result.ok) {
    if (result.code === "not_authenticated") {
      throw new PublicAppError("UNAUTHENTICATED", "Sign in to record lesson progress.");
    }
    if (result.code === "forbidden") {
      throw new PublicAppError("FORBIDDEN", "You are not enrolled in this course.");
    }
    if (result.code === "not_found") {
      throw new PublicAppError("NOT_FOUND", "Lesson not found.");
    }
    throw new PublicAppError("UNAVAILABLE", "Could not record completion. Please try again.");
  }
  return {
    changed: result.changed,
    progressPercent: result.progressPercent,
    learningStatus: result.learningStatus,
  };
}
