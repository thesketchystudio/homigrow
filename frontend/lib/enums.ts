// lib/enums.ts
// Frontend mirror of app/models/enums.py — values must stay byte-identical
// to the backend enums. Single source of truth for status/role strings on
// the frontend; import these everywhere instead of writing string literals.

export const UserRole = {
  client: "client",
  broker: "broker",
  admin: "admin",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OTPPurpose = {
  login: "login",
  signup: "signup",
  broker_verification: "broker_verification",
} as const;
export type OTPPurpose = (typeof OTPPurpose)[keyof typeof OTPPurpose];

export const PropertyStatus = {
  draft: "draft",
  pending: "pending",
  active: "active",
  sold: "sold",
  rented: "rented",
  expired: "expired",
  rejected: "rejected",
} as const;
export type PropertyStatus = (typeof PropertyStatus)[keyof typeof PropertyStatus];

export const ListingType = {
  sale: "sale",
  rent: "rent",
  pg: "pg",
} as const;
export type ListingType = (typeof ListingType)[keyof typeof ListingType];

// Human-readable labels for each ListingType, shared by PropertyHeader
// (Details page) and the homepage Listings section's card badge. Callers
// that also need per-badge color styling keep their own wrapper around
// this label.
export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  [ListingType.sale]: "For Sale",
  [ListingType.rent]: "For Rent",
  [ListingType.pg]: "PG / Co-living",
};

export const PropertyType = {
  apartment: "apartment",
  villa: "villa",
  independent_house: "independent_house",
  plot: "plot",
  land: "land",
  office: "office",
  shop: "shop",
  pg_colive: "pg_colive",
  // Rent-only, per the Post Property wizard's "Commercial & Spaces" dropdown group.
  commercial_building: "commercial_building",
  built_to_suit: "built_to_suit",
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

// Human-readable labels for each PropertyType, shared by the Listings
// filter sidebar and the Comparison table so both render identical
// category names.
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.apartment]: "Apartment",
  [PropertyType.villa]: "Villa",
  [PropertyType.independent_house]: "Independent House",
  [PropertyType.plot]: "Plot",
  [PropertyType.land]: "Land",
  [PropertyType.office]: "Office",
  [PropertyType.shop]: "Shop",
  [PropertyType.pg_colive]: "PG / Co-living",
  [PropertyType.commercial_building]: "Commercial Building",
  [PropertyType.built_to_suit]: "Built to Suit",
};

export const PriceFlexibility = {
  fixed: "fixed",
  negotiable: "negotiable",
  highly_flexible: "highly_flexible",
} as const;
export type PriceFlexibility = (typeof PriceFlexibility)[keyof typeof PriceFlexibility];

export const PRICE_FLEXIBILITY_LABELS: Record<PriceFlexibility, string> = {
  [PriceFlexibility.fixed]: "Fixed Price",
  [PriceFlexibility.negotiable]: "Negotiable",
  [PriceFlexibility.highly_flexible]: "Highly Flexible",
};

export const PaymentStructure = {
  full_payment: "full_payment",
  emi_installments: "emi_installments",
  construction_linked: "construction_linked",
} as const;
export type PaymentStructure = (typeof PaymentStructure)[keyof typeof PaymentStructure];

export const PAYMENT_STRUCTURE_LABELS: Record<PaymentStructure, string> = {
  [PaymentStructure.full_payment]: "Full Payment",
  [PaymentStructure.emi_installments]: "EMI / Installments",
  [PaymentStructure.construction_linked]: "Construction Linked",
};

export const Furnishing = {
  unfurnished: "unfurnished",
  semi_furnished: "semi_furnished",
  fully_furnished: "fully_furnished",
} as const;
export type Furnishing = (typeof Furnishing)[keyof typeof Furnishing];

export const MediaType = {
  image: "image",
  video: "video",
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const LeadStatus = {
  new: "new",
  contacted: "contacted",
  site_visit: "site_visit",
  negotiation: "negotiation",
  closed_won: "closed_won",
  closed_lost: "closed_lost",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const VerificationStatus = {
  unverified: "unverified",
  pending: "pending",
  verified: "verified",
  rejected: "rejected",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const BoostTier = {
  basic: "basic",
  featured: "featured",
  premium: "premium",
} as const;
export type BoostTier = (typeof BoostTier)[keyof typeof BoostTier];

export const OrderStatus = {
  created: "created",
  paid: "paid",
  failed: "failed",
  refunded: "refunded",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const BrokerDocumentType = {
  rera_certificate: "rera_certificate",
  government_id: "government_id",
} as const;
export type BrokerDocumentType = (typeof BrokerDocumentType)[keyof typeof BrokerDocumentType];
