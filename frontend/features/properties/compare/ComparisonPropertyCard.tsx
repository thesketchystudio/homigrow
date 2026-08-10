// features/properties/compare/ComparisonPropertyCard.tsx
// One property's summary card in the Comparison screen's top row (Figma
// node 133:3147 "Article - Card", image/title/location/price/actions).
// Deliberately omits the "✦ Best Value"/"✦ Most Space"/"✦ Top Rated"
// superlative badges Figma shows — no scoring algorithm exists to back
// them (same "don't fabricate" call as the Details page's Vaastu/Market
// Context sections). "Book Tour" toasts "not available yet", matching
// the Details page's own unbuilt enquiry form; "View" links to the real
// Property Details page.

"use client";

import Link from "next/link";
import { MapPin, X } from "lucide-react";

import type { PropertyRead } from "@/lib/api/endpoints/properties";
import { coverImageUrl } from "@/lib/property-media";
import { formatListingPrice } from "@/lib/utils";
import { toast } from "@/lib/toast";

export function ComparisonPropertyCard({ property, onRemove }: { property: PropertyRead; onRemove: (id: string) => void }) {
  const imageUrl = coverImageUrl(property.media);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="relative h-35 w-full shrink-0">
        {imageUrl && <img src={imageUrl} alt={property.title} className="size-full object-cover" />}
        <button
          type="button"
          onClick={() => onRemove(property.id)}
          aria-label="Remove from comparison"
          className="bg-background/70 absolute top-2 right-2 flex size-8 items-center justify-center rounded-full backdrop-blur"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-brand-primary-400 text-[16px] font-bold">{property.title}</span>
          <span className="text-brand-primary-600/70 flex items-center gap-1 text-[12px]">
            <MapPin className="size-3 shrink-0" />
            {property.locality}, {property.city}
          </span>
          <span className="font-heading text-brand-primary-400 text-[16px] font-bold">{formatListingPrice(property)}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toast.info("Booking a tour isn't available yet.")}
            className="border-brand-primary-400 text-brand-primary-400 flex-1 rounded-md border py-2 font-body text-[12px] font-medium"
          >
            Book Tour
          </button>
          <Link
            href={`/properties/${property.id}`}
            className="bg-brand-primary-600 text-brand-secondary-100 flex-1 rounded-md py-2 text-center font-body text-[12px] font-medium"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
