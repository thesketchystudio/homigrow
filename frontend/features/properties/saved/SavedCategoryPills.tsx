// features/properties/saved/SavedCategoryPills.tsx
// The category pill group from the "Filters" row (Figma node 133:3074:
// All/Villas/Penthouses/Commercial), wired to the real property_type
// filter GET /saved-properties now supports.
// "Penthouses" has no backing PropertyType category, so it's kept
// visible to match Figma but disabled — same pattern as the Listings
// sidebar's unbacked filter sections. That frame's "Selected: N
// Properties"/"Compare" control lives in CompareSelectionBar.tsx,
// rendered alongside these pills rather than inside this file. The
// "Recently Saved" sort control from that same design-context pull
// actually belongs to the Header row above it (node 133:3062), not
// here — see SavedSortControl.

"use client";

import { cn } from "@/lib/utils";
import { PropertyType } from "@/lib/enums";

export type SavedCategory = "all" | "villas" | "commercial";

const CATEGORY_PROPERTY_TYPES: Record<Exclude<SavedCategory, "all">, PropertyType[]> = {
  villas: [PropertyType.villa],
  commercial: [PropertyType.office, PropertyType.shop],
};

export function categoryToPropertyTypes(category: SavedCategory): PropertyType[] | undefined {
  return category === "all" ? undefined : CATEGORY_PROPERTY_TYPES[category];
}

function CategoryPill({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? "Coming soon" : undefined}
      className={cn(
        "rounded-lg px-6 py-2 font-body text-[14px] font-medium whitespace-nowrap",
        active ? "bg-brand-primary-400 text-brand-secondary-400" : "text-brand-primary-600/70",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {label}
    </button>
  );
}

export function SavedCategoryPills({
  category,
  onCategoryChange,
}: {
  category: SavedCategory;
  onCategoryChange: (category: SavedCategory) => void;
}) {
  return (
    <div className="flex w-fit items-center gap-2 rounded-xl bg-brand-green-200 p-1">
      <CategoryPill label="All" active={category === "all"} onClick={() => onCategoryChange("all")} />
      <CategoryPill label="Villas" active={category === "villas"} onClick={() => onCategoryChange("villas")} />
      <CategoryPill label="Penthouses" active={false} disabled />
      <CategoryPill label="Commercial" active={category === "commercial"} onClick={() => onCategoryChange("commercial")} />
    </div>
  );
}
