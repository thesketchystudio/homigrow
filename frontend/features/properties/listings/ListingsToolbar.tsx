// features/properties/listings/ListingsToolbar.tsx
// "Toolbar" (Figma node 28:713): heading + result count, Grid/"Show on
// map" toggle, and the sort dropdown. Map view has no implementation
// yet, so "Show on map" is a toast rather than a dead no-op button
// (same pattern as the Property Details page's unbuilt enquiry form).
// The Figma dropdown's default option is labeled "Featured" — renamed
// to "Newest" here since there's no boost/curation system behind it yet
// and "Featured" would overstate what the sort actually does; "Top
// Rated" is omitted for the same reason (no rating field exists). The
// map icon is the exact solid Figma glyph (not a Lucide stand-in) — a
// stroke-outline icon at this size read as a faint dotted smudge.

import type { ReactNode } from "react";
import { Grid2x2, SlidersHorizontal } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import type { SortValue } from "./types";

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 13.5 13.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 13.5L4.5 11.925L1.0125 13.275C0.7625 13.375 0.53125 13.3469 0.31875 13.1906C0.10625 13.0344 0 12.825 0 12.5625V2.0625C0 1.9 0.046875 1.75625 0.140625 1.63125C0.234375 1.50625 0.3625 1.4125 0.525 1.35L4.5 0L9 1.575L12.4875 0.225C12.7375 0.125 12.9687 0.153125 13.1812 0.309375C13.3937 0.465625 13.5 0.675 13.5 0.9375V11.4375C13.5 11.6 13.4531 11.7437 13.3594 11.8687C13.2656 11.9937 13.1375 12.0875 12.975 12.15L9 13.5V13.5M8.25 11.6625V2.8875L5.25 1.8375V10.6125L8.25 11.6625V11.6625M9.75 11.6625L12 10.9125V2.025L9.75 2.8875V11.6625V11.6625M1.5 11.475L3.75 10.6125V1.8375L1.5 2.5875V11.475V11.475M9.75 2.8875V2.8875V11.6625V11.6625V2.8875V2.8875M3.75 1.8375V1.8375V10.6125V10.6125V1.8375V1.8375"
        fill="currentColor"
      />
    </svg>
  );
}

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

type ListingsToolbarProps = {
  total: number;
  city?: string | null;
  // Kept separate from `city` — the free-text search box can match on
  // title/description/amenities too, so "Properties in {value}" would be
  // wrong for a non-location query (e.g. searching "pool").
  searchQuery?: string | null;
  sort: SortValue;
  onSortChange: (sort: SortValue) => void;
  onOpenFilters: () => void;
  // Rendered right-aligned below the Grid/Sort row — the Listings page's
  // own "Compare" button (Figma has it inline with "Selected: N
  // Properties" instead, but this screen positions it under Sort).
  compareSlot?: ReactNode;
};

function heading(city?: string | null, searchQuery?: string | null): string {
  if (city) return `Properties in ${city}`;
  if (searchQuery) return `Search results for "${searchQuery}"`;
  return "Curated Listings";
}

export function ListingsToolbar({ total, city, searchQuery, sort, onSortChange, onOpenFilters, compareSlot }: ListingsToolbarProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[28px] font-bold text-brand-primary-400">{heading(city, searchQuery)}</h1>
        <p className="font-body text-[16px] text-brand-primary-800/65">
          {total === 0 ? "No properties match your filters" : `Showing ${total} ${total === 1 ? "property" : "properties"}`}
        </p>
      </div>

      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenFilters}
            className="flex items-center gap-2 rounded-lg bg-brand-secondary-400 px-4 py-2 font-heading text-[16px] font-bold text-brand-primary-400 lg:hidden"
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
          </button>

          <div className="hidden shrink-0 items-center gap-1 rounded-lg bg-brand-secondary-400 p-1 sm:flex">
            <div className="flex items-center gap-2 rounded-md bg-background px-4 py-2 shadow-sm">
              <Grid2x2 className="size-3.5" />
              <span className="font-heading text-[16px] font-bold text-brand-primary-400">Grid</span>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Map view isn't available yet.")}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-heading text-[16px] font-bold text-brand-primary-800/65"
            >
              <MapIcon className="size-3.5 shrink-0" />
              Show on map
            </button>
          </div>

          <Select value={sort} onValueChange={(value) => onSortChange(value as SortValue)}>
            <SelectTrigger className="rounded-tl-lg rounded-tr-lg border-brand-secondary-500 bg-brand-secondary-400 font-heading text-[16px] font-bold text-brand-primary-400">
              <span>Sort by: </span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {compareSlot}
      </div>
    </div>
  );
}
