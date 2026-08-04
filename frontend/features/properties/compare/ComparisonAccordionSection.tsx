// features/properties/compare/ComparisonAccordionSection.tsx
// Generic collapsible section (Figma node 150:16293, exact colors/fonts
// pulled via get_design_context: bg-muted header, #f0f2f4 hairline column
// borders — no exact existing token for that hairline, used as an
// arbitrary value directly) reused for every section of the Comparison
// screen (10_Phase_3.md P3-T42): Overview, Amenities, Location, and
// Investment. `comingSoon` renders an honest placeholder instead of rows —
// used for Investment, which has zero backing data on the Property model
// (Rental Yield/Appreciation/RERA Status), same pattern as the Details
// page's Vaastu/Market Context sections.

"use client";

import { useState, type ReactNode } from "react";
import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

export type ComparisonRow = {
  key: string;
  label: string;
  icon?: ReactNode;
  values: ReactNode[];
  emphasize?: boolean;
};

export function ComparisonAccordionSection({
  title,
  rows,
  comingSoon,
  defaultOpen = true,
}: {
  title: string;
  rows: ComparisonRow[];
  comingSoon?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl bg-background shadow-[0px_2px_16px_0px_rgba(43,52,55,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="bg-muted flex w-full items-center justify-between border-b border-[#f0f2f4] px-5 py-3"
      >
        <span className="font-heading text-brand-primary-400 text-[12px] font-bold tracking-[1.2px] uppercase">{title}</span>
        <ChevronUp className={cn("text-brand-primary-400 size-4 transition-transform", !open && "rotate-180")} />
      </button>

      {open &&
        (comingSoon || rows.length === 0 ? (
          <p className="text-brand-primary-600/70 px-5 py-8 text-center font-body text-[14px]">Coming soon</p>
        ) : (
          <div>
            {rows.map((row) => (
              <div key={row.key} className="flex border-b border-[#f8f9fa] last:border-b-0">
                <div className="text-brand-primary-600/70 flex w-38.5 shrink-0 items-center gap-1.5 border-r border-[#f0f2f4] py-3 pl-5 font-body text-[12px] font-medium">
                  {row.icon}
                  {row.label}
                </div>
                {row.values.map((value, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 border-r border-[#f0f2f4] px-4.25 py-3 font-body text-[12px] last:border-r-0",
                      row.emphasize ? "font-heading text-brand-primary-400 text-[16px] font-bold" : "text-brand-primary-400"
                    )}
                  >
                    {value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
