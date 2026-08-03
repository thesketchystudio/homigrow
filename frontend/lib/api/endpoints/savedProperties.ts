// lib/api/endpoints/savedProperties.ts
// Typed functions for the authenticated /saved-properties resource
// (05_API_Design.md §saved-properties; 10_Phase_3.md P3-T40 backend,
// P3-T41 category filter + sort).

import { apiRequest } from "@/lib/api/client";
import type { PropertyListItem } from "@/lib/api/endpoints/properties";
import type { PropertyType } from "@/lib/enums";

export type SavedPropertyItem = PropertyListItem & { saved_at: string };

export type SavedPropertyListResponse = {
  items: SavedPropertyItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type SavedSort = "recent" | "price_asc" | "price_desc";

export type SavedPropertyListParams = {
  property_type?: PropertyType[];
  sort?: SavedSort;
  page?: number;
  page_size?: number;
};

export function listSavedProperties(params: SavedPropertyListParams = {}): Promise<SavedPropertyListResponse> {
  const search = new URLSearchParams();
  for (const value of params.property_type ?? []) search.append("property_type", value);
  if (params.sort) search.set("sort", params.sort);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.page_size !== undefined) search.set("page_size", String(params.page_size));
  const query = search.toString();
  return apiRequest<SavedPropertyListResponse>(`/saved-properties${query ? `?${query}` : ""}`);
}

export function saveProperty(propertyId: string): Promise<void> {
  return apiRequest<void>(`/saved-properties/${propertyId}`, { method: "PUT" });
}

export function unsaveProperty(propertyId: string): Promise<void> {
  return apiRequest<void>(`/saved-properties/${propertyId}`, { method: "DELETE" });
}
