import type { Category, Community, Course } from "../../data/types";
import type { ConnectedCatalog } from "./contracts";

function blockText(
  block: ConnectedCatalog["courses"][number]["modules"][number]["lessons"][number]["body"][number],
) {
  return block.text;
}

export function adaptConnectedCatalog(catalog: ConnectedCatalog): {
  categories: Category[];
  communities: Community[];
  courses: Course[];
} {
  const categories = catalog.categories.map<Category>((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    blurb: category.blurb,
    hue: category.accentHue,
    communityCount: 0,
  }));
  const communities = catalog.communities.map<Community>((community) => ({
    id: community.id,
    slug: community.slug,
    name: community.name,
    tagline: community.tagline,
    description: community.description,
    categorySlug: community.categorySlug,
    creatorHandle:
      catalog.courses.find((course) => course.communityId === community.id)?.instructor.handle ??
      "the-scenes",
    members: 0,
    online: 0,
    postsPerWeek: 0,
    rating: 0,
    reviews: 0,
    pricing: { type: "free" },
    privacy: community.privacy,
    languages: community.languages,
    founded: "2026-01-06T10:00:00Z",
    rules: [],
    highlights: [],
    accentHue: community.accentHue,
  }));

  const courses = catalog.courses.map<Course>((course) => {
    const community = catalog.communities.find((item) => item.id === course.communityId);
    const minutes = course.modules
      .flatMap((module) => module.lessons)
      .reduce((total, lesson) => total + lesson.durationMinutes, 0);
    return {
      id: course.id,
      slug: course.slug,
      communitySlug: community?.slug ?? "unavailable-community",
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      level: `${course.level[0]?.toUpperCase()}${course.level.slice(1)}` as Course["level"],
      categorySlug: "connected-catalogue",
      instructorHandle: course.instructor.handle,
      instructorName: course.instructor.displayName,
      instructorHeadline: course.instructor.headline,
      instructorLocation: course.instructor.location,
      instructorBio: course.instructor.bio,
      hours: Math.max(1, Math.round((minutes / 60) * 10) / 10),
      students: 0,
      rating: 0,
      reviews: 0,
      status: "published",
      price: "included",
      outcomes: course.outcomes,
      accentHue: community?.accentHue ?? 250,
      modules: course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          duration: `${lesson.durationMinutes} min`,
          type: lesson.kind,
          summary: lesson.summary,
          body: lesson.body.map(blockText),
          resources: lesson.resources.map((resource) => ({
            label: resource.label,
            kind: resource.kind,
            meta: "External HTTPS resource",
            url: resource.url,
          })),
          free: lesson.isPreview,
        })),
      })),
    };
  });

  return { categories, communities, courses };
}
