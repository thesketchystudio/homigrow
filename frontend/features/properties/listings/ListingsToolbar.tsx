// features/properties/listings/ListingsToolbar.tsx
// "Toolbar" (Figma node 28:713): heading + result count, Grid/"Show on
// map" toggle, and the sort dropdown. Map view has no implementation
// yet, so "Show on map" is a toast rather than a dead no-op button
// (same pattern as the Property Details page's unbuilt enquiry form).
// The Figma dropdown's default option is labeled "Featured" — renamed
// to "Newest" here since there's no boost/curation system behind it yet
// and "Featured" would overstate what the sort actually does; "Top
// Rated" is omitted for the same reason (no rating field exists).

import { Grid2x2, Map, SlidersHorizontal } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import type { SortValue } from "./types";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

type ListingsToolbarProps = {
  total: number;
  sort: SortValue;
  onSortChange: (sort: SortValue) => void;
  onOpenFilters: () => void;
};

export function ListingsToolbar({ total, sort, onSortChange, onOpenFilters }: ListingsToolbarProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[28px] font-bold text-brand-primary-400">Curated Listings</h1>
        <p className="font-body text-[16px] text-brand-primary-800/65">
          {total === 0 ? "No properties match your filters" : `Showing ${total} ${total === 1 ? "property" : "properties"}`}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex items-center gap-2 rounded-lg bg-brand-secondary-400 px-4 py-2 font-heading text-[16px] font-bold text-brand-primary-400 lg:hidden"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
        </button>

        <div className="hidden items-center gap-1 rounded-lg bg-brand-secondary-400 p-1 sm:flex">
          <div className="flex items-center gap-2 rounded-md bg-background px-4 py-2 shadow-sm">
            <Grid2x2 className="size-3.5" />
            <span className="font-heading text-[16px] font-bold text-brand-primary-400">Grid</span>
          </div>
          <button
            type="button"
            onClick={() => toast.info("Map view isn't available yet.")}
            className="flex items-center gap-2 px-4 py-2 font-heading text-[16px] font-bold text-brand-primary-800/65"
          >
            <Map className="size-3.5" />
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
    </div>
  );
}
