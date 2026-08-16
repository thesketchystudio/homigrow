// features/properties/compare/ComparisonHeader.tsx
// "Back to saved" / "Download report" row + "Comparison" title (Figma node
// 150:15350, exact colors/fonts pulled via get_design_context — same
// brand-primary-400/brand-primary-600 tokens the Saved page's own header
// already uses). Download report toasts "not available yet" — no
// report-generation service exists, same pattern as the Details page's
// Market Report button.

"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

import { toast } from "@/lib/toast";

export function ComparisonHeader({ propertyCount }: { propertyCount: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/saved" className="text-brand-primary-400 flex items-center gap-2 font-body text-[14px] font-medium">
          <ArrowLeft className="size-4" />
          Back to saved
        </Link>
        <button
          type="button"
          onClick={() => toast.info("Downloadable reports aren't available yet.")}
          className="text-brand-primary-400 flex items-center gap-2 font-body text-[14px] font-medium"
        >
          <Download className="size-4" />
          Download report
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-brand-primary-400 text-[32px] font-bold sm:text-[48px]">Comparison</h1>
        <p className="font-body text-brand-primary-600/70 text-[18px]">
          {propertyCount} exceptional {propertyCount === 1 ? "property" : "properties"} meticulously selected for your portfolio
        </p>
      </div>
    </div>
  );
}
