// features/properties/listings/FilterSidebar.tsx
// "AsideSidebarFilters" (Figma node 126:1311, "Curated Listings" search
// screen). Price Range, Bedrooms, Listing Type (Figma's "Lease Type"
// Residential/Commercial pills repurposed to Buy/Rent/PG — that pair
// maps onto the real listing_type enum, "Residential vs Commercial"
// doesn't), Property Type (Figma's marketing labels like "Estates &
// Mansions" replaced with the real PropertyType categories), and
// Amenities are fully wired to GET /properties. Metro Station (needs a
// station-name dataset we don't have), Property Use (commercial
// sub-categories not modeled), and "Founder's property" (no backing
// field) are rendered matching Figma but disabled/"Coming soon" —
// checkbox-style controls that silently no-op on click would be worse
// UX than the toast pattern used for one-off action buttons elsewhere.
// See project memory figma-listings-search-screen-2026-07-30.

import { ChevronDown } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { PillGroup } from "@/features/auth/preferences/PillGroup";
import { ListingType, PropertyType } from "@/lib/enums";
import { cn, formatINR } from "@/lib/utils";
import { DEFAULT_FILTERS, PRICE_MAX, PRICE_MIN, PRICE_STEP, type ListingsFilters } from "./types";

const BEDROOM_OPTIONS = [
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const LISTING_TYPE_OPTIONS = [
  { value: ListingType.sale, label: "Buy" },
  { value: ListingType.rent, label: "Rent" },
  { value: ListingType.pg, label: "PG" },
];

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: PropertyType.apartment, label: "Apartment" },
  { value: PropertyType.villa, label: "Villa" },
  { value: PropertyType.independent_house, label: "Independent House" },
  { value: PropertyType.plot, label: "Plot" },
  { value: PropertyType.office, label: "Office" },
  { value: PropertyType.shop, label: "Shop" },
  { value: PropertyType.pg_colive, label: "PG / Co-living" },
];

const PROPERTY_USE_OPTIONS = ["Cafe", "Restaurant", "Retail Store", "Office Space"];

const AMENITY_OPTIONS = [
  { value: "Metro station", label: "Metro station" },
  { value: "Swimming pool", label: "Swimming pool" },
];

function SectionHeading({ children, comingSoon }: { children: React.ReactNode; comingSoon?: boolean }) {
  return (
    <p className="font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-primary-300">
      {children}
      {comingSoon && <span className="ml-2 normal-case tracking-normal text-brand-primary-300/70">(Coming soon)</span>}
    </p>
  );
}

type FilterSidebarProps = {
  filters: ListingsFilters;
  onChange: (filters: ListingsFilters) => void;
  className?: string;
};

export function FilterSidebar({ filters, onChange, className }: FilterSidebarProps) {
  const set = <K extends keyof ListingsFilters>(key: K, value: ListingsFilters[K]) => onChange({ ...filters, [key]: value });

  const togglePropertyType = (value: PropertyType) => {
    set("propertyTypes", filters.propertyTypes.includes(value) ? filters.propertyTypes.filter((v) => v !== value) : [...filters.propertyTypes, value]);
  };

  return (
    <aside className={cn("w-full shrink-0 bg-brand-secondary-400 p-8 lg:w-[320px]", className)}>
      <div className="flex w-full flex-col gap-9">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[20px] font-bold text-brand-primary-400">Filters</h2>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="border-b border-brand-secondary-800 font-heading text-[14px] font-bold text-brand-primary-800"
          >
            Reset All
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading>Price Range</SectionHeading>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-background px-3 py-1.5 shadow-sm">
                <p className="font-heading text-[16px] font-medium text-brand-primary-400">{formatINR(filters.priceMin)}</p>
              </div>
              <div className="mx-4 h-px flex-1 bg-brand-secondary-500" />
              <div className="rounded-lg bg-background px-3 py-1.5 shadow-sm">
                <p className="font-heading text-[16px] font-medium text-brand-primary-400">
                  {filters.priceMax >= PRICE_MAX ? `${formatINR(PRICE_MAX)}+` : formatINR(filters.priceMax)}
                </p>
              </div>
            </div>
            <Slider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={[filters.priceMin, filters.priceMax]}
              onValueChange={([lo, hi]) => onChange({ ...filters, priceMin: lo, priceMax: hi })}
              className="**:data-[slot=slider-track]:h-1 **:data-[slot=slider-track]:bg-brand-secondary-500 **:data-[slot=slider-range]:bg-brand-green-700 **:data-[slot=slider-thumb]:size-3 **:data-[slot=slider-thumb]:border-brand-green-700 **:data-[slot=slider-thumb]:bg-brand-green-700"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading>Bedrooms</SectionHeading>
          <PillGroup
            options={BEDROOM_OPTIONS}
            variant="compact"
            multiple={false}
            value={filters.bhkMin === null ? null : String(filters.bhkMin)}
            onChange={(value) => set("bhkMin", filters.bhkMin === Number(value) ? null : Number(value))}
            className="flex-nowrap"
          />
        </div>

        <div className="flex flex-col gap-4 opacity-50">
          <SectionHeading comingSoon>Metro Station</SectionHeading>
          <div className="flex flex-col gap-4">
            {["From", "To"].map((label) => (
              <div key={label} className="flex flex-col gap-2">
                <p className="font-heading text-[16px] font-medium text-brand-primary-400">{label}</p>
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-between border-b border-brand-primary-800 px-3 py-2 text-left"
                >
                  <span className="font-heading text-[16px] text-brand-secondary-700">Select station</span>
                  <ChevronDown className="size-3 text-brand-primary-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading>Listing Type</SectionHeading>
          <PillGroup
            options={LISTING_TYPE_OPTIONS}
            variant="filter"
            multiple={false}
            value={filters.listingType}
            onChange={(value) => set("listingType", filters.listingType === value ? null : (value as ListingType))}
            className="[&>button]:flex-1"
          />
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading>Property Type</SectionHeading>
          <div className="flex flex-col gap-1.5">
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-3">
                <Checkbox
                  checked={filters.propertyTypes.includes(option.value)}
                  onCheckedChange={() => togglePropertyType(option.value)}
                  className="size-4 border-brand-secondary-700 data-[state=checked]:border-brand-primary-400 data-[state=checked]:bg-brand-primary-400 data-[state=checked]:text-background"
                />
                <span className="font-body text-[14px] text-brand-primary-400">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 opacity-50">
          <SectionHeading comingSoon>Property Use</SectionHeading>
          <div className="flex flex-col gap-1.5">
            {PROPERTY_USE_OPTIONS.map((label) => (
              <label key={label} className="flex items-center gap-3">
                <Checkbox disabled className="size-4 border-brand-secondary-700" />
                <span className="font-body text-[14px] text-brand-primary-400">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 opacity-50">
          <SectionHeading comingSoon>Special Filters</SectionHeading>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-3">
              <Checkbox disabled className="size-4 border-brand-secondary-700" />
              <span className="font-body text-[14px] text-brand-primary-400">Founder&apos;s property</span>
            </label>
            <p className="font-heading text-[16px] text-brand-secondary-700">Show only founder&apos;s properties</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading>Amenities</SectionHeading>
          <PillGroup
            options={AMENITY_OPTIONS}
            variant="filter"
            multiple={true}
            value={filters.amenities}
            onChange={(value) => set("amenities", value)}
            className="flex-col items-stretch"
          />
        </div>
      </div>
    </aside>
  );
}
