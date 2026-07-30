// lib/api/endpoints/properties.ts
// Typed functions for the public /properties resource (05_API_Design.md,
// 10_Phase_3.md P3-T04). No auth required — GET /properties/{id} serves
// the public Property Details screen.

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
