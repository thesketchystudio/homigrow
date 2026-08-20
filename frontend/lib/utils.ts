// lib/utils.ts
// Merges Tailwind classes safely, resolving conflicting utility classes
// in favor of the last one applied. Used by every component in
// components/ui.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { ListingType } from "@/lib/enums";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// react-hook-form's `valueAsNumber: true` runs the raw string through
// `Number()`, which turns a blank input into NaN rather than undefined —
// NaN then fails an `.optional()` zod number field's base type check
// with a confusing "expected number, received NaN" instead of being
// treated as legitimately empty. Use as `register("field", { setValueAs:
// toOptionalNumber })` for any optional numeric form field.
export function toOptionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

// Formats a rupee amount using Indian lakh/crore short-scale notation
// (e.g. 7500000 -> "₹75L", 130000000 -> "₹13Cr"), matching the buyer
// preference wizard's price-range display.
export function formatINR(amount: number): string {
  if (amount >= 1_00_00_000) {
    return `₹${Math.round(amount / 1_00_00_000)}Cr`;
  }
  if (amount >= 1_00_000) {
    return `₹${Math.round(amount / 1_00_000)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Formats a property listing's price for card display. Sale listings use
// formatINR's lakh/crore short-scale notation (a one-time price); rent and
// PG listings render the raw monthly rupee amount with "/mo" appended,
// since formatINR's short-scale would misrepresent a recurring figure.
export function formatListingPrice(item: { listing_type: ListingType; price: number }): string {
  if (item.listing_type === ListingType.sale) {
    return formatINR(item.price);
  }
  return `₹${Math.round(item.price).toLocaleString("en-IN")}/mo`;
}
