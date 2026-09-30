// features/properties/PropertyHeader.tsx
// Title, location, listing-type tag, price, and the Quick Stats row
// (Figma node 31:1863). Only renders a quick-stat when the property
// actually has that field — several (parking, built_year, metro
// distance) are optional on the backend.

"use client";

import { useState } from "react";
import { BedDouble, Building, CalendarDays, Car, Check, Droplet, House, MapPin, Maximize2, Share2, TrainFront } from "lucide-react";

import type { PropertyRead } from "@/lib/api/endpoints/properties";
import { ListingType, LISTING_TYPE_LABELS as LISTING_TAG, PropertyType, PROPERTY_TYPE_LABELS } from "@/lib/enums";
import { toast } from "@/lib/toast";

function formatPriceINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

const RESIDENTIAL_TYPES: PropertyType[] = [PropertyType.apartment, PropertyType.villa, PropertyType.independent_house, PropertyType.pg_colive];
const LAND_TYPES: PropertyType[] = [PropertyType.plot, PropertyType.land];

// The backend has no "purpose" column; it follows from the property type.
function purposeLabel(type: PropertyType): string {
  if (RESIDENTIAL_TYPES.includes(type)) return "Residential";
  if (LAND_TYPES.includes(type)) return "Land";
  return "Commercial";
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

  const stats: { icon: React.ReactNode; label: string; value: string; sub?: string }[] = [
    { icon: <Building className="size-5" />, label: "Type", value: PROPERTY_TYPE_LABELS[property.property_type] },
    { icon: <House className="size-5" />, label: "Purpose", value: purposeLabel(property.property_type) },
  ];
  if (property.area_sqft) {
    stats.push({ icon: <Maximize2 className="size-5" />, label: "Area", value: `${property.area_sqft.toLocaleString("en-IN")} SQFT` });
  }
  if (property.bhk) {
    stats.push({ icon: <BedDouble className="size-5" />, label: "Bedrooms", value: `${String(property.bhk).padStart(2, "0")} Units` });
  }
  if (property.bathrooms) {
    stats.push({ icon: <Droplet className="size-5" />, label: "Bathrooms", value: `${String(property.bathrooms).padStart(2, "0")} Baths` });
  }
  if (property.parking_slots) {
    stats.push({ icon: <Car className="size-5" />, label: "Parking", value: `${String(property.parking_slots).padStart(2, "0")} Slots` });
  }
  if (property.metro_distance_km != null) {
    stats.push({ icon: <TrainFront className="size-5" />, label: "Metro", value: property.locality, sub: `${property.metro_distance_km} kms` });
  }
  if (property.built_year) {
    stats.push({ icon: <CalendarDays className="size-5" />, label: "Year Built", value: String(property.built_year) });
  }
  if (isRecurring) {
    stats.push({ icon: <Check className="size-5" />, label: "Lease", value: "Available" });
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
          {property.maintenance_monthly != null && (
            <p className="font-body text-[12px] uppercase tracking-[1.2px] text-brand-primary-300">Inclusive of Maintenance</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-10 gap-y-8 border-y border-[rgba(198,198,205,0.2)] py-[33px] sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <div className="shrink-0 text-brand-primary-600">{stat.icon}</div>
            <div className="flex flex-col">
              <span className="font-heading text-[12px] uppercase leading-4 tracking-[1.2px] text-brand-primary-600/80">{stat.label}</span>
              <span className="font-heading text-[16px] font-bold leading-6 text-brand-primary-600">{stat.value}</span>
              {stat.sub && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-3 text-brand-green-700" />
                  <span className="font-heading text-[16px] font-bold leading-6 text-brand-green-700">{stat.sub}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
