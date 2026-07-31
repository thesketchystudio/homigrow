// lib/api/endpoints/properties.ts
// Typed functions for the public /properties resource (05_API_Design.md,
// 10_Phase_3.md P3-T04 detail + P3-T10 search). No auth required —
// GET /properties/{id} serves the public Property Details screen,
// GET /properties serves the Listings search grid.

import { apiRequest } from "@/lib/api/client";
import type { Furnishing, ListingType, MediaType, PropertyType, VerificationStatus } from "@/lib/enums";

export type PropertyMediaRead = {
  id: string;
  media_type: MediaType;
  url: string;
  stream_uid?: string;
  position: number;
  is_cover: boolean;
  width?: number;
  height?: number;
};

export type PropertyBrokerRead = {
  id: string;
  full_name?: string;
  broker_profile?: {
    verification_status: VerificationStatus;
  };
};

export type PropertyRead = {
  id: string;
  title: string;
  description?: string;
  listing_type: ListingType;
  property_type: PropertyType;
  price: number;
  maintenance_monthly?: number;
  deposit?: number;
  is_negotiable: boolean;
  bhk?: number;
  bathrooms?: number;
  area_sqft?: number;
  floor?: number;
  total_floors?: number;
  facing?: string;
  built_year?: number;
  parking_slots?: number;
  furnishing?: Furnishing;
  amenities: string[];
  address_line: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  metro_distance_m?: number;
  metro_distance_km?: number;
  media: PropertyMediaRead[];
  broker: PropertyBrokerRead;
  published_at?: string;
};

export function getProperty(id: string): Promise<PropertyRead> {
  return apiRequest<PropertyRead>(`/properties/${id}`);
}

export type PropertySort = "newest" | "price_asc" | "price_desc";

export type PropertyListItem = {
  id: string;
  title: string;
  listing_type: ListingType;
  property_type: PropertyType;
  price: number;
  // Pydantic's Optional[T] always serializes as an explicit JSON `null`,
  // never an absent key — typed `| null` (not `?`) so a null !== undefined
  // check downstream can't silently treat "no value" as "has a value".
  bhk: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  furnishing: Furnishing | null;
  city: string;
  locality: string;
  cover_image_url: string | null;
  published_at: string | null;
};

export type PropertyListResponse = {
  items: PropertyListItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type PropertyListParams = {
  city?: string;
  listing_type?: ListingType;
  property_type?: PropertyType[];
  price_min?: number;
  price_max?: number;
  bhk_min?: number;
  amenities?: string[];
  sort?: PropertySort;
  page?: number;
  page_size?: number;
};

// Exported so the Listings page can build the identical query string for
// the browser URL (shareable/bookmarkable filtered views) without
// duplicating this param-serialization logic.
export function buildQueryString(params: PropertyListParams): string {
  const search = new URLSearchParams();
  if (params.city) search.set("city", params.city);
  if (params.listing_type) search.set("listing_type", params.listing_type);
  for (const value of params.property_type ?? []) search.append("property_type", value);
  if (params.price_min !== undefined) search.set("price_min", String(params.price_min));
  if (params.price_max !== undefined) search.set("price_max", String(params.price_max));
  if (params.bhk_min !== undefined) search.set("bhk_min", String(params.bhk_min));
  for (const value of params.amenities ?? []) search.append("amenities", value);
  if (params.sort) search.set("sort", params.sort);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.page_size !== undefined) search.set("page_size", String(params.page_size));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listProperties(params: PropertyListParams = {}): Promise<PropertyListResponse> {
  return apiRequest<PropertyListResponse>(`/properties${buildQueryString(params)}`);
}
