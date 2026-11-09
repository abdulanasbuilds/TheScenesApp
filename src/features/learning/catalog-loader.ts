import {
  categories as fixtureCategories,
  communities as fixtureCommunities,
  courses as fixtureCourses,
} from "../../data/seed";
import { dataMode } from "../../lib/data-mode";
import { adaptConnectedCatalog } from "./catalog-adapter";
import { getConnectedCatalog } from "./learning.functions";

export async function loadCatalogForRoute() {
  if (dataMode === "fixtures") {
    return {
      categories: fixtureCategories,
      communities: fixtureCommunities,
      courses: fixtureCourses,
    };
  }
  const result = await getConnectedCatalog({ data: {} });
  if (!result.ok) throw new Error(result.error.message);
  return adaptConnectedCatalog(result.data);
}
