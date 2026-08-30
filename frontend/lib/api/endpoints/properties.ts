// lib/api/endpoints/properties.ts
// Typed functions for the public /properties resource. No auth required —
// GET /properties/{id} serves the public Property Details screen,
// GET /properties serves the Listings search grid.

import { apiRequest, apiRequestMultipart } from "@/lib/api/client";
import type { Furnishing, ListingType, MediaType, PropertyStatus, PropertyType, VerificationStatus } from "@/lib/enums";
import type { LandDetailsValues, PlotDetailsValues } from "@/lib/validation/postProperty";

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
  status: PropertyStatus;
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
  plot_details?: PlotDetailsValues;
  land_details?: LandDetailsValues;
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
  locality?: string;
  // Free-text match against title, description, city, locality, landmark,
  // or amenities (matches ANY of them) — for the nav search box, which
  // can't know what kind of value was typed. Distinct from city/locality
  // above, which are exact matches driven by dropdowns and neighborhood
  // links that already know the precise value. Deliberately just
  // substring matching, not keyword/facet parsing — property type/bedroom
  // count already have precise dedicated filters below.
  search?: string;
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

// The param shape buildQueryString actually serializes — a superset of
// PropertyListParams (`sort` widened to `string`) so other list endpoints
// with their own sort literal union (e.g. saved-properties' SavedSort) can
// reuse this same serialization instead of hand-rolling their own
// URLSearchParams construction. Every concrete params type below (a
// PropertyListParams, a SavedPropertyListParams, ...) is a structural
// subtype of this and can be passed directly.
export type ListQueryParams = {
  city?: string;
  locality?: string;
  search?: string;
  listing_type?: ListingType;
  property_type?: PropertyType[];
  price_min?: number;
  price_max?: number;
  bhk_min?: number;
  amenities?: string[];
  sort?: string;
  page?: number;
  page_size?: number;
};

// Exported so the Listings page can build the identical query string for
// the browser URL (shareable/bookmarkable filtered views), and so other
// /list-style endpoints (e.g. saved-properties) can reuse the same
// param-serialization logic instead of duplicating it.
export function buildQueryString(params: ListQueryParams): string {
  const queryParams = new URLSearchParams();
  if (params.city) queryParams.set("city", params.city);
  if (params.locality) queryParams.set("locality", params.locality);
  if (params.search) queryParams.set("search", params.search);
  if (params.listing_type) queryParams.set("listing_type", params.listing_type);
  for (const value of params.property_type ?? []) queryParams.append("property_type", value);
  if (params.price_min !== undefined) queryParams.set("price_min", String(params.price_min));
  if (params.price_max !== undefined) queryParams.set("price_max", String(params.price_max));
  if (params.bhk_min !== undefined) queryParams.set("bhk_min", String(params.bhk_min));
  for (const value of params.amenities ?? []) queryParams.append("amenities", value);
  if (params.sort) queryParams.set("sort", params.sort);
  if (params.page !== undefined) queryParams.set("page", String(params.page));
  if (params.page_size !== undefined) queryParams.set("page_size", String(params.page_size));
  const query = queryParams.toString();
  return query ? `?${query}` : "";
}

export function listProperties(params: PropertyListParams = {}): Promise<PropertyListResponse> {
  return apiRequest<PropertyListResponse>(`/properties${buildQueryString(params)}`);
}

export const MAX_COMPARE_IDS = 3;

export type PropertyCompareResponse = {
  items: PropertyRead[];
};

export function compareProperties(ids: string[]): Promise<PropertyCompareResponse> {
  return apiRequest<PropertyCompareResponse>(`/properties/compare?ids=${ids.join(",")}`);
}

export type NeighborhoodSummary = {
  locality: string;
  city: string;
  property_count: number;
  cover_image_url: string | null;
};

export function getNeighborhoods(limit = 4): Promise<NeighborhoodSummary[]> {
  return apiRequest<NeighborhoodSummary[]>(`/properties/neighborhoods?limit=${limit}`);
}

// Broker-authenticated Post Property wizard. createProperty fires once,
// at the wizard's final step — Steps 1 (info) and 2 (media) are only
// collected client-side until then, since the backend can't create a
// valid row before price is known (Property.price is NOT NULL with a
// `price > 0` check). See PropertyCreateRequest's docstring in
// app/schemas/properties.py for the full reasoning.
export type PropertyCreateInput = {
  title: string;
  listing_type: ListingType;
  property_type: PropertyType;
  bhk?: number;
  bathrooms?: number;
  area_sqft?: number;
  facing?: string;
  furnishing?: Furnishing;
  built_year?: number;
  amenities: string[];
  plot_details?: PlotDetailsValues;
  land_details?: LandDetailsValues;
  address_line: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  price: number;
  maintenance_monthly?: number;
  deposit?: number;
  is_negotiable: boolean;
};

export function createProperty(data: PropertyCreateInput): Promise<PropertyRead> {
  return apiRequest<PropertyRead>("/properties", { method: "POST", body: data });
}

export function uploadPropertyMedia(propertyId: string, images: File[]): Promise<PropertyMediaRead[]> {
  const formData = new FormData();
  for (const image of images) formData.append("images", image);
  return apiRequestMultipart<PropertyMediaRead[]>(`/properties/${propertyId}/media`, formData);
}

export function submitProperty(propertyId: string): Promise<PropertyRead> {
  return apiRequest<PropertyRead>(`/properties/${propertyId}/submit`, { method: "POST" });
}
