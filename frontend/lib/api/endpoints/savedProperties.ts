// lib/api/endpoints/savedProperties.ts
// Typed functions for the authenticated /saved-properties resource.

import { apiRequest } from "@/lib/api/client";
import { buildQueryString, type PropertyListItem } from "@/lib/api/endpoints/properties";
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
  return apiRequest<SavedPropertyListResponse>(`/saved-properties${buildQueryString(params)}`);
}

export function saveProperty(propertyId: string): Promise<void> {
  return apiRequest<void>(`/saved-properties/${propertyId}`, { method: "PUT" });
}

export function unsaveProperty(propertyId: string): Promise<void> {
  return apiRequest<void>(`/saved-properties/${propertyId}`, { method: "DELETE" });
}
