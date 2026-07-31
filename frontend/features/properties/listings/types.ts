// features/properties/listings/types.ts
// Shared filter-state shape for the Listings page. Maps 1:1 onto
// PropertyListParams (lib/api/endpoints/properties.ts) — kept as a
// separate UI-facing type since sliders/pills work with nulls/arrays
// that the API layer converts into query params.

import type { ListingType, PropertyType } from "@/lib/enums";

export const PRICE_MIN = 50_00_000;
export const PRICE_MAX = 15_00_00_000;
const PRICE_STEP = 5_00_000;

export { PRICE_STEP };

export type ListingsFilters = {
  city: string | null;
  priceMin: number;
  priceMax: number;
  bhkMin: number | null;
  listingType: ListingType | null;
  propertyTypes: PropertyType[];
  amenities: string[];
};

export const DEFAULT_FILTERS: ListingsFilters = {
  city: null,
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  bhkMin: null,
  listingType: null,
  propertyTypes: [],
  amenities: [],
};

export type SortValue = "newest" | "price_asc" | "price_desc";
