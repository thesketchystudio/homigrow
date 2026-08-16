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
