// features/properties/saved/SavedSortControl.tsx
// The "Recently Saved" sort control — part of the Header row (Figma
// node 133:3062/133:3068), right-aligned against the "Your Curated
// Collection" title, NOT the Filters row below it. A compact pill
// button (bg-secondary-400, rounded-xl), not the full-width Select
// trigger style ListingsToolbar uses for its sort dropdown — this one
// is sized to its content per Figma. Wired to the real `sort` param
// GET /saved-properties now supports (10_Phase_3.md P3-T41): "Recently
// Saved" (the pre-existing default order) plus Price Low/High, matching
// the same real-sorts-only convention as the Listings page.

"use client";

import { ArrowUpDown } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SavedSort } from "@/lib/api/endpoints/savedProperties";

const SORT_OPTIONS: { value: SavedSort; label: string }[] = [
  { value: "recent", label: "Recently Saved" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function SavedSortControl({ sort, onSortChange }: { sort: SavedSort; onSortChange: (sort: SavedSort) => void }) {
  return (
    <Select value={sort} onValueChange={(value) => onSortChange(value as SavedSort)}>
      <SelectTrigger className="h-auto w-fit gap-2 rounded-xl border-none bg-brand-secondary-400 px-6 py-3 font-body text-[16px] font-medium text-brand-primary-400 [&_svg]:size-3.5">
        <ArrowUpDown className="text-brand-primary-400" />
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
  );
}
