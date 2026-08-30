// lib/validation/postProperty.ts
// Zod schemas for the Post Property wizard's Info and Pricing steps,
// mirroring the backend's PropertyCreateRequest (app/schemas/properties.py)
// so the broker sees identical validation client-side first.

import { z } from "zod";
import { Furnishing, ListingType, PropertyType } from "@/lib/enums";

// Types whose Step 1 sub-form only collects the shared residential fields
// (bed/bath/area, furnishing, amenities) — no type-specific block below.
export const RESIDENTIAL_PROPERTY_TYPES = [PropertyType.apartment, PropertyType.villa, PropertyType.independent_house] as const;

// Full set the wizard's Property Type dropdown currently offers. PG/Co-living
// and Commercial Building reuse the same Property model and PropertyType
// enum but need their own type-specific sub-forms, deferred to later passes.
export const POSTABLE_PROPERTY_TYPES = [...RESIDENTIAL_PROPERTY_TYPES, PropertyType.plot, PropertyType.land] as const;

// Standard 8-point compass facing, matching common Indian real-estate
// listing convention (not sourced from Figma — its Plot Details frame only
// showed a "Select facing" placeholder, no option list).
export const FACING_OPTIONS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"] as const;

// Figma "Land Details" approval checkboxes.
export const LAND_APPROVAL_OPTIONS = ["Podi", "Change of Land", "Conversion", "RERA", "BMRDA"] as const;

export const plotDetailsSchema = z.object({
  dimension: z.string().trim().max(50).optional(),
  is_corner_plot: z.boolean().optional(),
});
export type PlotDetailsValues = z.infer<typeof plotDetailsSchema>;

export const landDetailsSchema = z.object({
  land_use: z.enum(["residential", "commercial"]).optional(),
  approvals: z.array(z.string()).optional(),
});
export type LandDetailsValues = z.infer<typeof landDetailsSchema>;

export const propertyInfoSchema = z.object({
  listing_type: z.enum([ListingType.sale, ListingType.rent]),
  title: z.string().trim().min(1, "Listing title is required").max(200),
  property_type: z.enum(POSTABLE_PROPERTY_TYPES, { error: "Select a property type" }),
  built_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  bhk: z.number().int().min(1).max(20).optional(),
  bathrooms: z.number().int().min(1).max(20).optional(),
  area_sqft: z.number().positive().optional(),
  facing: z.string().optional(),
  furnishing: z.enum([Furnishing.unfurnished, Furnishing.semi_furnished, Furnishing.fully_furnished]).optional(),
  amenities: z.array(z.string()),
  plot_details: plotDetailsSchema.optional(),
  land_details: landDetailsSchema.optional(),
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
