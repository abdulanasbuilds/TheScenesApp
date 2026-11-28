import type { Course } from "@/data/types";

/**
 * First-run onboarding for The Scenes.
 *
 * The flow stays deliberately short: goals and focus on step 1, the public profile on step 2 and a
 * single recommended first step on step 3. Selections are held in the browser profile store so the
 * learner home and the creator overview can point a new account at one useful action immediately.
 *
 * Fixture/preview scope only. No server profile field is created for role or focus; the display name
 * still flows through the existing profile function in connected mode.
 */

export type OnboardingRole = "learner" | "creator";

export type OnboardingProfile = {
  role: OnboardingRole;
  /** Category slugs the member chose to focus on. */
  focusAreas: string[];
  displayName: string;
  avatarHue: number;
  /** The course the member selected on the final step, if any. */
  firstCourseId: string | null;
  /** ISO timestamp once the flow is finished; null while onboarding is still pending. */
  completedAt: string | null;
};

export const ONBOARDING_STORAGE_KEY = "thescenes.onboarding.v1";

export const EMPTY_ONBOARDING_PROFILE: OnboardingProfile = {
  role: "learner",
  focusAreas: [],
  displayName: "",
  avatarHue: 246,
  firstCourseId: null,
  completedAt: null,
};

/** The two goals a new account chooses between. */
export const ROLE_OPTIONS: ReadonlyArray<{
  value: OnboardingRole;
  title: string;
  description: string;
}> = [
  {
    value: "learner",
    title: "I want to learn",
    description: "Follow short, practical courses and build real skills.",
  },
  {
    value: "creator",
    title: "I want to teach / build a community",
    description: "Turn your expertise into lessons, a community and income.",
  },
];

/** The five launch focus areas, mapped to existing catalogue category slugs. */
export const FOCUS_AREAS: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
}> = [
  { id: "ai-automation", label: "AI", description: "Agents, evals and automation." },
  { id: "web-product", label: "Web & Mobile", description: "Build and ship software products." },
  { id: "design", label: "Design", description: "Product, brand and interface craft." },
  {
    id: "business-freelancing",
    label: "Freelancing",
    description: "Clients, pricing and independent income.",
  },
  { id: "content-media", label: "Content Creation", description: "Video, writing and audio." },
];

/** Curated avatar tints — no upload is connected, so the avatar is generated in the product style. */
export const AVATAR_HUES: readonly number[] = [246, 320, 196, 28, 344, 168];

export function focusAreaLabel(id: string): string {
  return FOCUS_AREAS.find((area) => area.id === id)?.label ?? id;
}

export function focusAreaLabels(ids: readonly string[]): string[] {
  return ids.map(focusAreaLabel);
}

/**
 * Deterministically ranks catalogue courses against the chosen focus areas.
 *
 * Free-to-start courses (a free community or a free first lesson) are preferred so the recommended
 * first step never asks a brand-new member to pay before they have learned anything.
 */
export function recommendedCourses(
  courses: readonly Course[],
  focusAreas: readonly string[],
  isFreeToStart: (course: Course) => boolean,
  limit = 3,
): Course[] {
  const rank = (list: readonly Course[]) =>
    [...list].sort((a, b) => {
      const free = Number(isFreeToStart(b)) - Number(isFreeToStart(a));
      if (free !== 0) return free;
      if (b.students !== a.students) return b.students - a.students;
      return a.title.localeCompare(b.title);
    });

  const inFocus = focusAreas.length
    ? courses.filter((course) => focusAreas.includes(course.categorySlug))
    : [...courses];

  const ranked = rank(inFocus);
  if (ranked.length) return ranked.slice(0, limit);
  return rank(courses).slice(0, limit);
}

/** The first lesson a member should open for a course. */
export function firstLessonHref(course: Course): string {
  const lesson = course.modules.flatMap((module) => module.lessons)[0];
  const segment = lesson?.slug ?? lesson?.id ?? "overview";
  return `/c/${course.communitySlug}/classroom/${course.slug}/${segment}`;
}

/** True when a course can be started without paying (free community or free first lesson). */
export function courseIsFreeToStart(
  course: Course,
  communities: ReadonlyArray<{ slug: string; pricing: { type: string } }>,
): boolean {
  const community = communities.find((item) => item.slug === course.communitySlug);
  if (community?.pricing.type === "free") return true;
  return course.modules.some((module) => module.lessons.some((lesson) => lesson.free));
}
