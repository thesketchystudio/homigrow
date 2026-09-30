// features/ai-tools/ToolPageShell.tsx
// Shared page chrome for every individual AI Tools calculator screen
// (Figma's "ToolLayout" component, e.g. node 735:1495 for Loan Calculator):
// a light page with a "← Tools" back link, the H1 and a "Download report"
// button (no PDF generation exists yet, so it shows a toast), then the
// tool body, the disclaimer card and the "Explore more
// tools" row. Extracted once since all 7 calculator screens share this
// exact shell — only the body differs.

import Link from "next/link";
import { Info } from "lucide-react";

import { toast } from "@/lib/toast";

import { ExploreMoreTools } from "./ExploreMoreTools";

export function ToolPageShell({ slug, title, children }: { slug: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center bg-brand-secondary-400 px-6 pt-32 pb-16 sm:px-16 lg:px-[150px]">
      <div className="flex w-full max-w-[1100px] flex-col gap-[72px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-4">
                <Link href="/ai-tools" className="font-body text-[14px] font-bold text-brand-primary-100 hover:text-brand-primary-500">
                  ← Tools
                </Link>
                <h1 className="font-heading text-[36px] leading-[1.25] font-bold text-brand-primary-400 sm:text-[48px]">{title}</h1>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Report download isn't available yet — check back soon.")}
                className="w-[186px] rounded bg-gradient-to-br from-black to-[#131b2e] py-4 font-heading text-[16px] font-bold text-brand-secondary-100"
              >
                Download report
              </button>
            </div>
            {children}
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-brand-secondary-500 bg-brand-green-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-brand-green-200 p-2">
                <Info className="size-5 text-brand-primary-500" />
              </div>
              <p className="font-heading text-[16px] font-bold text-brand-primary-500">Important Disclaimer</p>
            </div>
            <p className="font-body text-[14px] leading-[22px] text-brand-primary-600/80">
              Results are estimates only and may vary based on property details, location, market conditions, lender requirements, taxes, fees, and other
              factors. This information is for general guidance and is not financial, legal, tax, or real estate advice. Please contact a qualified real
              estate professional for an accurate assessment.
            </p>
          </div>
        </div>

        <ExploreMoreTools slug={slug} />
      </div>
    </div>
  );
}
