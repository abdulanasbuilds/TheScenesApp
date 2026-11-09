import "@tanstack/react-start/server-only";
import type { ConnectedCatalog } from "../../features/learning/contracts";
import { applyPrivateNoStoreResponse } from "../http/errors.server";
import { CatalogRepository } from "../repositories/catalog.repository.server";
import { createRequestSupabaseClient } from "../supabase/server-client.server";

export async function getVisibleCatalog(): Promise<ConnectedCatalog> {
  applyPrivateNoStoreResponse();
  return new CatalogRepository(createRequestSupabaseClient()).findVisibleCatalog();
}
