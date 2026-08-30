// features/profile/preferences/OverflowChipsSection.tsx
// Read-only chip list for one Preferences-tab category (Figma
// "PreferencesSection"/"OverflowChips", node 577:1747): an uppercase
// label heading, dark filled chips with a checkmark, and a "+N more" /
// "Show less" toggle once the list exceeds `initialVisible`. Figma's own
// mock only shows 3 categories at a handful of items each — this is the
// same visual component reused for all 15 BuyerPreferences fields, most
// of which have longer lists, so the toggle is load-bearing here rather
// than cosmetic.

"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const DEFAULT_VISIBLE = 6;

export function OverflowChipsSection({
  label,
  items,
  initialVisible = DEFAULT_VISIBLE,
}: {
  label: string;
  items: string[];
  initialVisible?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const overflowCount = items.length - initialVisible;
  const visibleItems = expanded || overflowCount <= 0 ? items : items.slice(0, initialVisible);

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="font-heading text-[12px] font-bold tracking-[1.2px] text-[#232323] uppercase">{label}</p>
      <div className="flex w-full flex-wrap items-center gap-2">
        {visibleItems.map((item) => (
          <span key={item} className="flex items-center gap-2 rounded bg-[#232323] px-4 py-2.5 font-body text-[12px] font-medium text-[#fefeff]">
            <Check size={14} />
            {item}
          </span>
        ))}
        {overflowCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 rounded bg-[#f1f5f9] px-4 py-2.5 font-body text-[12px] font-medium text-[#64748b]"
          >
            <ChevronDown size={14} className={expanded ? "rotate-180" : undefined} />
            {expanded ? "Show less" : `+${overflowCount} more`}
          </button>
        )}
      </div>
    </div>
  );
}

// Single-value variant for scalar fields (buy_timeline, target_roi, …) —
// same chip visual, just one item and no overflow toggle.
export function SingleChipSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <p className="font-heading text-[12px] font-bold tracking-[1.2px] text-[#232323] uppercase">{label}</p>
      <span className="flex w-fit items-center gap-2 rounded bg-[#232323] px-4 py-2.5 font-body text-[12px] font-medium text-[#fefeff]">
        <Check size={14} />
        {value}
      </span>
    </div>
  );
}
