// lib/validation/postProperty.ts
// Zod schemas for the Post Property wizard's Info and Pricing steps,
// mirroring the backend's PropertyCreateRequest (app/schemas/properties.py)
// so the broker sees identical validation client-side first.

import { z } from "zod";
import { Furnishing, ListingType, PropertyType } from "@/lib/enums";

// Residential-only for this build — Plot/Land/PG/Commercial reuse the
// same Property model and PropertyType enum but need their own
// type-specific sub-forms, deferred to a later phase.
export const RESIDENTIAL_PROPERTY_TYPES = [PropertyType.apartment, PropertyType.villa, PropertyType.independent_house] as const;

export const propertyInfoSchema = z.object({
  listing_type: z.enum([ListingType.sale, ListingType.rent]),
  title: z.string().trim().min(1, "Listing title is required").max(200),
  property_type: z.enum(RESIDENTIAL_PROPERTY_TYPES, { error: "Select a property type" }),
  built_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  bhk: z.number().int().min(1).max(20).optional(),
  bathrooms: z.number().int().min(1).max(20).optional(),
  area_sqft: z.number().positive().optional(),
  furnishing: z.enum([Furnishing.unfurnished, Furnishing.semi_furnished, Furnishing.fully_furnished]).optional(),
  amenities: z.array(z.string()),
  address_line: z.string().trim().min(1, "Address is required").max(255),
  locality: z.string().trim().min(1, "Locality is required").max(100),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  pincode: z
    .string()
    .trim()
    .min(6, "Enter a valid 6-digit pincode")
    .max(6, "Enter a valid 6-digit pincode")
    .regex(/^\d{6}$/, "Pincode must contain only digits"),
  landmark: z.string().trim().optional(),
});
export type PropertyInfoValues = z.infer<typeof propertyInfoSchema>;

export const propertyPricingSchema = z.object({
  price: z.number({ error: "Enter a valid price" }).positive("Enter a valid price"),
  maintenance_monthly: z.number().positive().optional(),
  deposit: z.number().positive().optional(),
  is_negotiable: z.boolean(),
});
export type PropertyPricingValues = z.infer<typeof propertyPricingSchema>;
