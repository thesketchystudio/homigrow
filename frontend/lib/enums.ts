// lib/enums.ts
// Frontend mirror of app/models/enums.py — values must stay byte-identical
// to the backend enums. Single source of truth for status/role strings on
// the frontend; import these everywhere instead of writing string literals.

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
