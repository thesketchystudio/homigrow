// features/properties/CompareSelectionBar.tsx
// The "Selected: N Properties"/"Compare" control from the Saved page's own
// Filters row (Figma node 133:3084-133:3090, exact colors/fonts pulled via
// get_design_context) — deliberately dropped when Saved shipped, added back
// here. CompareDrawer is scoped to the saved/search pages, so this same
// control is reused on the Listings page toolbar too rather than
// inventing a divergent design for it. The
// "Click any property card..." hint (node 150:18423) shows only while
// nothing is selected yet, mirroring the "saved_2" first-use variant frame.
//
// The Listings page positions the "Compare" button itself separately —
// right-aligned under the toolbar's Sort control, not inline next to
// "Selected: N Properties" — so the button is exported standalone
// (CompareButton) and CompareSelectionBar can hide its own copy via
// `hideButton` while keeping the text/hint row in place. The Saved page
// keeps the combined layout (its own Figma frame shows them inline).

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftRight, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { MAX_COMPARE_IDS, useCompareStore } from "@/lib/stores/compare";

export function CompareButton({ className }: { className?: string }) {
  const router = useRouter();
  const ids = useCompareStore((state) => state.ids);
  const count = ids.length;

  return (
    <button
      type="button"
      onClick={() => router.push(`/compare?ids=${ids.join(",")}`)}
      disabled={count < 2}
      className={cn(
        "flex items-center gap-2 rounded-xl border-2 border-[#575e70] px-4.5 py-2.5 font-body text-[16px] font-medium text-[#575e70] disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      <ArrowLeftRight className="size-4" />
      Compare
    </button>
  );
}

export function CompareSelectionBar({
  hideButton = false,
  spread = false,
}: {
  hideButton?: boolean;
  // Pushes the button to the far right of the row instead of sitting right
  // next to the "Selected: N Properties" text — the Saved page's own Figma
  // frame shows them inline, so this stays opt-in rather than the default.
  spread?: boolean;
}) {
  const ids = useCompareStore((state) => state.ids);
  const count = ids.length;

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("flex items-center gap-4", spread && "justify-between")}>
        <span className="font-body text-[14px] font-medium whitespace-nowrap text-[#586064]">
          Selected: <span className="text-[#2b3437]">{count} {count === 1 ? "Property" : "Properties"}</span>
        </span>
        {!hideButton && <CompareButton />}
      </div>

      {count === 0 && (
        <div className="flex items-center gap-2">
          <CircleCheck className="text-brand-primary-600/70 size-3.5 shrink-0" />
          <p className="font-body text-brand-primary-600/70 text-[12px]">
            Click any property card to select it for comparison (up to {MAX_COMPARE_IDS})
          </p>
        </div>
      )}
    </div>
  );
}
