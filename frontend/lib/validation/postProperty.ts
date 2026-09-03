// lib/validation/postProperty.ts
// Zod schemas for the Post Property wizard's Info and Pricing steps,
// mirroring the backend's PropertyCreateRequest (app/schemas/properties.py)
// so the broker sees identical validation client-side first.

import { z } from "zod";
import { Furnishing, ListingType, PaymentStructure, PriceFlexibility, PropertyType } from "@/lib/enums";

// Types whose Step 1 sub-form only collects the shared residential fields
// (bed/bath/area, furnishing, amenities) — no type-specific block below.
export const RESIDENTIAL_PROPERTY_TYPES = [PropertyType.apartment, PropertyType.villa, PropertyType.independent_house] as const;

type PropertyTypeOption = { value: PropertyType; label: string };
type PropertyTypeGroup = { label: string; options: PropertyTypeOption[] };

// Property Type dropdown groups, split by listing_type — Sell and Rent
// offer different sets in Figma (Sell: Plot/Land/JV-eligible types, no
// commercial; Rent: PG plus commercial spaces, no Plot/Land).
export const SELL_PROPERTY_TYPE_GROUPS: PropertyTypeGroup[] = [
  {
    label: "Residential",
    options: [
      { value: PropertyType.apartment, label: "Apartment / Flat" },
      { value: PropertyType.villa, label: "Villa" },
      { value: PropertyType.independent_house, label: "Independent House" },
      { value: PropertyType.plot, label: "Plot" },
      { value: PropertyType.pg_colive, label: "PG / Co-living Building" },
    ],
  },
  {
    label: "Commercial & Land",
    options: [{ value: PropertyType.land, label: "Land above 10,000 sqft" }],
  },
];

export const RENT_PROPERTY_TYPE_GROUPS: PropertyTypeGroup[] = [
  {
    label: "Residential",
    options: [
      { value: PropertyType.apartment, label: "Flat" },
      { value: PropertyType.independent_house, label: "Independent House" },
      { value: PropertyType.villa, label: "Villa" },
      { value: PropertyType.pg_colive, label: "PG / Co-living" },
    ],
  },
  {
    label: "Commercial & Spaces",
    options: [
      { value: PropertyType.shop, label: "Shop" },
      { value: PropertyType.commercial_building, label: "Commercial Building" },
      { value: PropertyType.built_to_suit, label: "Built to Suit" },
    ],
  },
];

// Union of every value either group can produce — the zod schema validates
// the submitted value alone, so it isn't scoped to listing_type the way the
// dropdown's visible options are.
export const POSTABLE_PROPERTY_TYPES = [
  PropertyType.apartment,
  PropertyType.villa,
  PropertyType.independent_house,
  PropertyType.plot,
  PropertyType.land,
  PropertyType.pg_colive,
  PropertyType.shop,
  PropertyType.commercial_building,
  PropertyType.built_to_suit,
] as const;

// Standard 8-point compass facing, matching common Indian real-estate
// listing convention (not sourced from Figma — its Plot Details frame only
// showed a "Select facing" placeholder, no option list).
export const FACING_OPTIONS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"] as const;

// Figma "Land Details" approval checkboxes.
export const LAND_APPROVAL_OPTIONS = ["Podi", "Change of Land", "Conversion", "RERA", "BMRDA"] as const;

// Figma PG sub-form option lists.
export const PG_OCCUPANCY_TYPE_OPTIONS = ["Single", "Double", "Triple"] as const;
export const PG_GENDER_OPTIONS = ["Male", "Female", "Mixed"] as const;
export const PG_GENDER_PREFERENCE_OPTIONS = ["Male", "Female", "Any"] as const;
export const PG_BATHROOM_TYPE_OPTIONS = ["Attached", "Common"] as const;
export const PG_AC_OPTIONS = ["AC", "Non-AC"] as const;
export const PG_AMENITY_OPTIONS = ["WiFi", "Meals", "Laundry", "Parking", "AC", "Security", "Housekeeping", "Gym"] as const;

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

export const jvPartnerSchema = z.object({
  name: z.string().trim().min(1, "Partner name is required").max(150),
  role: z.string().trim().max(100).optional(),
  split_percent: z.number().min(0).max(100).optional(),
  email: z.string().trim().max(255).optional(),
  can_edit: z.boolean(),
  can_approve: z.boolean(),
  can_publish: z.boolean(),
});
export type JVPartnerValues = z.infer<typeof jvPartnerSchema>;

export const jvDetailsSchema = z.object({
  partners: z.array(jvPartnerSchema).optional(),
  commission_mode: z.enum(["auto", "manual"]).optional(),
});
export type JVDetailsValues = z.infer<typeof jvDetailsSchema>;

// Covers all three Figma PG sub-forms (Sell building details, Rent Entire
// Building, Rent Unit/Room) in one flexible, all-optional shape — mirrors
// the backend's PGDetails schema, which stores it as one JSONB blob.
export const pgDetailsSchema = z.object({
  listing_scope: z.enum(["entire", "unit"]).optional(),
  total_floors: z.number().int().min(0).optional(),
  currently_operational: z.boolean().optional(),
  estimated_monthly_revenue: z.number().positive().optional(),
  total_rooms: z.number().int().min(0).optional(),
  occupancy_types: z.array(z.string()).optional(),
  gender: z.string().optional(),
  monthly_rent_per_bed: z.number().positive().optional(),
  room_type: z.string().optional(),
  floor: z.number().int().optional(),
  bathroom_type: z.string().optional(),
  ac: z.string().optional(),
  gender_preference: z.string().optional(),
  monthly_rent: z.number().positive().optional(),
  meals_included: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
});
export type PGDetailsValues = z.infer<typeof pgDetailsSchema>;

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
  pg_details: pgDetailsSchema.optional(),
  is_jv_property: z.boolean(),
  jv_details: jvDetailsSchema.optional(),
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
  price_per_sqft: z.number().positive().optional(),
  token_amount: z.number().positive().optional(),
  maintenance_monthly: z.number().positive().optional(),
  deposit: z.number().positive().optional(),
  is_negotiable: z.boolean(),
  price_flexibility: z.enum([PriceFlexibility.fixed, PriceFlexibility.negotiable, PriceFlexibility.highly_flexible]),
  payment_structure: z.enum([PaymentStructure.full_payment, PaymentStructure.emi_installments, PaymentStructure.construction_linked]),
  stamp_duty_percent: z.number().min(0).max(100).optional(),
  registration_fee_percent: z.number().min(0).max(100).optional(),
  brokerage_included: z.boolean(),
  brokerage_percent: z.number().min(0).max(100).optional(),
});
export type PropertyPricingValues = z.infer<typeof propertyPricingSchema>;

// Media step's extra fields (virtual tour link) — not part of the zod-
// validated info/pricing steps since it's a single optional URL with no
// server-side shape to mirror beyond Property.virtual_tour_url.
export type MediaExtrasValues = {
  virtual_tour_url: string;
};
