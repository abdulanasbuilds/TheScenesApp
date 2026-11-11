import {
  categories as fixtureCategories,
  communities as fixtureCommunities,
  courses as fixtureCourses,
} from "../../data/seed";
import { resolveRuntimeDataMode } from "../shared/runtime-mode";
import { adaptConnectedCatalog } from "./catalog-adapter";
import { getConnectedCatalog } from "./learning.functions";

/**
 * Load the catalogue for a route loader.
 *
 * The runtime mode comes from the server so a Cloudflare deployment is configured from the hosting
 * dashboard, not from a build-time constant. In `fixtures` mode the deterministic seed catalogue is
 * returned; in a connected mode the server catalogue is fetched and adapted.
 */
export async function loadCatalogForRoute() {
  const mode = await resolveRuntimeDataMode();
  if (mode === "fixtures") {
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
