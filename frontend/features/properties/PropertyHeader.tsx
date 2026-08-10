// features/properties/PropertyHeader.tsx
// Title, location, listing-type tag, price, and the Quick Stats row
// (Figma node 31:1863). Only renders a quick-stat when the property
// actually has that field — several (parking, built_year, metro
// distance) are optional on the backend.

"use client";

import { useState } from "react";
import { Bath, BedDouble, CalendarDays, Car, MapPin, Ruler, Share2, TrainFront } from "lucide-react";

import type { PropertyRead } from "@/lib/api/endpoints/properties";
import { ListingType, LISTING_TYPE_LABELS as LISTING_TAG } from "@/lib/enums";
import { toast } from "@/lib/toast";

function formatPriceINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function PropertyHeader({ property }: { property: PropertyRead }) {
  const [copied, setCopied] = useState(false);
  const isRecurring = property.listing_type !== ListingType.sale;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const stats: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (property.area_sqft) {
    stats.push({ icon: <Ruler className="size-5" />, label: "Area", value: `${property.area_sqft.toLocaleString("en-IN")} SQFT` });
  }
  if (property.bhk) {
    stats.push({ icon: <BedDouble className="size-5" />, label: "Bedrooms", value: `${String(property.bhk).padStart(2, "0")} Units` });
  }
  if (property.bathrooms) {
    stats.push({ icon: <Bath className="size-5" />, label: "Bathrooms", value: `${String(property.bathrooms).padStart(2, "0")} Baths` });
  }
  if (property.parking_slots) {
    stats.push({ icon: <Car className="size-5" />, label: "Parking", value: `${String(property.parking_slots).padStart(2, "0")} Slots` });
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-heading text-[32px] font-bold leading-[1.15] text-brand-primary-600 sm:text-[48px] sm:leading-[60px]">
              {property.title}
            </h1>
            <button
              type="button"
              onClick={handleShare}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-heading text-[16px] font-bold text-brand-secondary-900"
            >
              <Share2 className="size-4" />
              {copied ? "Copied!" : "Share property"}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-primary-600/70" />
              <p className="font-body text-[18px] text-brand-primary-600/80">
                {property.locality}, {property.city}
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-1.5 rounded border-[0.8px] border-[rgba(50,210,93,0.35)] bg-[rgba(50,210,53,0.1)] px-2.5 py-1">
              <span className="size-1.5 rounded-full bg-[#009a2e]" />
              <span className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-[#009a2e]">
                {LISTING_TAG[property.listing_type]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-end gap-1">
            <span className="font-heading text-[36px] font-bold leading-[44px] text-brand-primary-600">
              {formatPriceINR(property.price)}
            </span>
            {isRecurring && <span className="font-heading text-[16px] font-medium text-brand-primary-600/80">/mo</span>}
          </div>
          {property.maintenance_monthly !== undefined && (
            <p className="font-body text-[12px] uppercase tracking-[1.2px] text-brand-primary-300">Inclusive of Maintenance</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-8 border-y border-[rgba(198,198,205,0.2)] py-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <div className="text-brand-primary-600">{stat.icon}</div>
            <div className="flex flex-col">
              <span className="font-body text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">{stat.label}</span>
              <span className="font-heading text-[16px] font-bold text-brand-primary-600">{stat.value}</span>
            </div>
          </div>
        ))}

        {(property.metro_distance_km !== undefined || property.built_year) && (
          <div className="flex gap-8">
            {property.metro_distance_km !== undefined && (
              <div className="flex items-center gap-3">
                <TrainFront className="size-5 text-brand-primary-600" />
                <div className="flex flex-col">
                  <span className="font-body text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Metro</span>
                  <div className="flex items-center gap-1">
                    <span className="font-heading text-[16px] font-bold text-brand-primary-600">{property.locality}</span>
                    <MapPin className="size-3 text-brand-green-700" />
                    <span className="font-heading text-[16px] font-bold text-brand-green-700">{property.metro_distance_km} kms</span>
                  </div>
                </div>
              </div>
            )}
            {property.built_year && (
              <div className="flex items-center gap-3">
                <CalendarDays className="size-5 text-brand-primary-600" />
                <div className="flex flex-col">
                  <span className="font-body text-[12px] uppercase tracking-[1.2px] text-brand-primary-600/80">Year Built</span>
                  <span className="font-heading text-[16px] font-bold text-brand-primary-600">{property.built_year}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
