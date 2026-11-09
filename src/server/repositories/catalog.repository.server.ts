import "@tanstack/react-start/server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../../db/database.types";
import {
  connectedCatalogSchema,
  connectedLessonBlockSchema,
  type ConnectedCatalog,
} from "../../features/learning/contracts";

function parseBody(value: Json) {
  const parsed = connectedLessonBlockSchema.array().safeParse(value);
  if (!parsed.success) throw new Error("Lesson content did not match body version 1.");
  return parsed.data;
}

export class CatalogRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findVisibleCatalog(): Promise<ConnectedCatalog> {
    const [
      categoriesResult,
      communityCategoriesResult,
      communitiesResult,
      coursesResult,
      modulesResult,
      lessonsResult,
      outcomesResult,
      contentsResult,
      resourcesResult,
      profilesResult,
    ] = await Promise.all([
      this.client
        .from("categories")
        .select("id, name, slug, blurb, accent_hue")
        .order("sort_order"),
      this.client.from("community_categories").select("community_id, category_id, is_primary"),
      this.client
        .from("communities")
        .select("id, slug, name, tagline, description, privacy, join_policy, accent_hue, languages")
        .order("published_at", { ascending: false }),
      this.client
        .from("courses")
        .select(
          "id, community_id, instructor_id, slug, title, subtitle, description, level, access",
        )
        .order("published_at", { ascending: false }),
      this.client.from("course_modules").select("id, course_id, title, position").order("position"),
      this.client
        .from("lessons")
        .select(
          "id, course_id, module_id, slug, title, summary, kind, duration_minutes, is_preview, position",
        )
        .order("position"),
      this.client.from("course_outcomes").select("course_id, body, position").order("position"),
      this.client.from("lesson_contents").select("lesson_id, body"),
      this.client
        .from("lesson_resources")
        .select("id, lesson_id, label, kind, url, position")
        .order("position"),
      this.client.from("profiles").select("id, handle, display_name, headline, location, bio"),
    ]);

    const firstError = [
      categoriesResult,
      communityCategoriesResult,
      communitiesResult,
      coursesResult,
      modulesResult,
      lessonsResult,
      outcomesResult,
      contentsResult,
      resourcesResult,
      profilesResult,
    ].find((result) => result.error)?.error;
    if (firstError) throw firstError;

    const categories = (categoriesResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      blurb: row.blurb,
      accentHue: row.accent_hue,
    }));
    const categorySlugById = new Map(categories.map((category) => [category.id, category.slug]));
    const primaryCategoryByCommunity = new Map(
      (communityCategoriesResult.data ?? [])
        .filter((row) => row.is_primary)
        .map((row) => [row.community_id, categorySlugById.get(row.category_id) ?? "other"]),
    );

    const communities = (communitiesResult.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      description: row.description,
      categorySlug: primaryCategoryByCommunity.get(row.id) ?? "other",
      privacy: row.privacy,
      joinPolicy: row.join_policy,
      accentHue: row.accent_hue,
      languages: row.languages,
    }));

    const contentsByLesson = new Map(
      (contentsResult.data ?? []).map((row) => [row.lesson_id, parseBody(row.body)]),
    );
    type ResourceRow = NonNullable<typeof resourcesResult.data>[number];
    const resourcesByLesson = new Map<string, ResourceRow[]>();
    for (const resource of resourcesResult.data ?? []) {
      const current = resourcesByLesson.get(resource.lesson_id) ?? [];
      current.push(resource);
      resourcesByLesson.set(resource.lesson_id, current);
    }
    type LessonRow = NonNullable<typeof lessonsResult.data>[number];
    const lessonsByModule = new Map<string, LessonRow[]>();
    for (const lesson of lessonsResult.data ?? []) {
      const current = lessonsByModule.get(lesson.module_id) ?? [];
      current.push(lesson);
      lessonsByModule.set(lesson.module_id, current);
    }
    type ModuleRow = NonNullable<typeof modulesResult.data>[number];
    const modulesByCourse = new Map<string, ModuleRow[]>();
    for (const module of modulesResult.data ?? []) {
      const current = modulesByCourse.get(module.course_id) ?? [];
      current.push(module);
      modulesByCourse.set(module.course_id, current);
    }
    const outcomesByCourse = new Map<string, string[]>();
    for (const outcome of outcomesResult.data ?? []) {
      const current = outcomesByCourse.get(outcome.course_id) ?? [];
      current.push(outcome.body);
      outcomesByCourse.set(outcome.course_id, current);
    }
    const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));

    const courses = (coursesResult.data ?? []).map((course) => {
      const instructor = profiles.get(course.instructor_id);
      if (!instructor) throw new Error("Visible course instructor profile is unavailable.");
      return {
        id: course.id,
        communityId: course.community_id,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        level: course.level,
        access: course.access,
        instructor: {
          handle: instructor.handle,
          displayName: instructor.display_name,
          headline: instructor.headline,
          location: instructor.location,
          bio: instructor.bio,
        },
        outcomes: outcomesByCourse.get(course.id) ?? [],
        modules: (modulesByCourse.get(course.id) ?? []).map((module) => ({
          id: module.id,
          courseId: module.course_id,
          title: module.title,
          position: module.position,
          lessons: (lessonsByModule.get(module.id) ?? []).map((lesson) => {
            const body = contentsByLesson.get(lesson.id) ?? [];
            return {
              id: lesson.id,
              courseId: lesson.course_id,
              moduleId: lesson.module_id,
              slug: lesson.slug,
              title: lesson.title,
              summary: lesson.summary,
              kind: lesson.kind,
              durationMinutes: lesson.duration_minutes,
              isPreview: lesson.is_preview,
              position: lesson.position,
              body,
              resources: (resourcesByLesson.get(lesson.id) ?? []).map((resource) => ({
                id: resource.id,
                label: resource.label,
                kind: resource.kind,
                url: resource.url,
              })),
              contentAvailable: body.length > 0,
            };
          }),
        })),
      };
    });

    return connectedCatalogSchema.parse({ categories, communities, courses });
  }
}
