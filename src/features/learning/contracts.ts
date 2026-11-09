import { z } from "zod";

export const connectedResourceSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  kind: z.enum(["link", "pdf", "sheet", "repo"]),
  url: z.string().url().startsWith("https://"),
});

export const connectedLessonBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string(),
  }),
  z.object({
    type: z.literal("callout"),
    tone: z.enum(["tip", "warning", "info"]),
    text: z.string(),
  }),
]);

export const connectedLessonSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  moduleId: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  kind: z.enum(["video", "reading", "exercise"]),
  durationMinutes: z.number().int().positive(),
  isPreview: z.boolean(),
  position: z.number().int().positive(),
  body: z.array(connectedLessonBlockSchema),
  resources: z.array(connectedResourceSchema),
  contentAvailable: z.boolean(),
});

export const connectedModuleSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  position: z.number().int().positive(),
  lessons: z.array(connectedLessonSchema),
});

export const connectedCourseSchema = z.object({
  id: z.string().uuid(),
  communityId: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  access: z.enum(["included", "restricted"]),
  instructor: z.object({
    handle: z.string(),
    displayName: z.string(),
    headline: z.string().nullable(),
    location: z.string().nullable(),
    bio: z.string().nullable(),
  }),
  outcomes: z.array(z.string()),
  modules: z.array(connectedModuleSchema),
});

export const connectedCommunitySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  categorySlug: z.string(),
  privacy: z.enum(["public", "private"]),
  joinPolicy: z.enum(["open", "invite"]),
  accentHue: z.number().int(),
  languages: z.array(z.string()),
});

export const connectedCatalogSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      blurb: z.string(),
      accentHue: z.number().int(),
    }),
  ),
  communities: z.array(connectedCommunitySchema),
  courses: z.array(connectedCourseSchema),
});

export type ConnectedCatalog = z.infer<typeof connectedCatalogSchema>;
export type ConnectedCommunity = z.infer<typeof connectedCommunitySchema>;
export type ConnectedCourse = z.infer<typeof connectedCourseSchema>;
export type ConnectedLesson = z.infer<typeof connectedLessonSchema>;
