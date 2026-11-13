// features/admin/format.ts
// Display helpers shared by every admin screen: the short listing
// reference shown in tables and cards, date formatting, and rupee
// amounts (the backend sends decimals as strings).

import type { Decimal } from "@/lib/api/endpoints/admin";
import { ListingType } from "@/lib/enums";
import { formatINR, formatListingPrice } from "@/lib/utils";

// A readable, stable reference derived from the listing's UUID. Not a
// stored identifier — the UUID stays the real key in every API call.
export function listingRef(id: string): string {
  return `HG-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function formatAdminDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMonthYear(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function formatAdminPrice(price: Decimal, listingType: ListingType = ListingType.sale): string {
  return formatListingPrice({ listing_type: listingType, price: Number(price) });
}

export function formatRupeeAmount(amount: Decimal): string {
  return formatINR(Number(amount));
}

// Whole days since a timestamp, for "in queue for N days".
export function daysSince(value: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
}

export function pluralDays(days: number): string {
  return days === 1 ? "1 day" : `${days} days`;
}
