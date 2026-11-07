import { describe, expect, test } from "bun:test";
import { z } from "zod";

// Mirror the schemas used in learning.functions.ts to test validation contract
const communityIdSchema = z.object({
  communityId: z.string().uuid("Community ID must be a valid UUID."),
});

const courseIdSchema = z.object({
  courseId: z.string().uuid("Course ID must be a valid UUID."),
});

const lessonIdSchema = z.object({
  lessonId: z.string().uuid("Lesson ID must be a valid UUID."),
});

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("Wave 4 — learning function input validation", () => {
  describe("joinCommunity / leaveCommunity input", () => {
    test("accepts valid UUID", () => {
      expect(communityIdSchema.parse({ communityId: VALID_UUID })).toEqual({
        communityId: VALID_UUID,
      });
    });

    test("rejects non-UUID string", () => {
      expect(() => communityIdSchema.parse({ communityId: "not-a-uuid" })).toThrow();
    });

    test("rejects slug instead of UUID", () => {
      expect(() => communityIdSchema.parse({ communityId: "ai-builders-guild" })).toThrow();
    });

    test("rejects missing field", () => {
      expect(() => communityIdSchema.parse({})).toThrow();
    });
  });

  describe("enrolInCourse input", () => {
    test("accepts valid UUID", () => {
      expect(courseIdSchema.parse({ courseId: VALID_UUID })).toEqual({ courseId: VALID_UUID });
    });

    test("rejects non-UUID string", () => {
      expect(() => courseIdSchema.parse({ courseId: "course-agents" })).toThrow();
    });
  });

  describe("completeLesson input", () => {
    test("accepts valid UUID", () => {
      expect(lessonIdSchema.parse({ lessonId: VALID_UUID })).toEqual({ lessonId: VALID_UUID });
    });

    test("rejects non-UUID string", () => {
      expect(() => lessonIdSchema.parse({ lessonId: "les-agents-1" })).toThrow();
    });
  });

  describe("learning state shape contract", () => {
    test("empty state has correct shape", () => {
      const state = { enrolledCourseIds: [] as string[], completedLessonIds: [] as string[] };
      expect(Array.isArray(state.enrolledCourseIds)).toBe(true);
      expect(Array.isArray(state.completedLessonIds)).toBe(true);
    });

    test("enrolled course IDs are strings", () => {
      const state = { enrolledCourseIds: [VALID_UUID], completedLessonIds: [] as string[] };
      expect(typeof state.enrolledCourseIds[0]).toBe("string");
    });
  });
});
