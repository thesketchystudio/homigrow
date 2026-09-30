// features/ai-tools/ToolsHub.tsx
// AI Tools landing page (Figma node 734:1237, "ToolsHub"): a dark hero
// band, a 7-card grid linking to each calculator, and a green "Get
// Immediate Real-Time Tools Access" CTA band. The CTA's email capture has
// no backing service (Figma treats it as marketing copy, not a real
// signup flow) so it's static markup only, matching the "coming soon"
// treatment other unbuilt CTAs use elsewhere in the app.

import { TOOLS } from "./toolsCatalog";
import { ToolCardLink } from "./ToolCardLink";

export function ToolsHub() {
  return (
    <div className="flex flex-col">
      <section className="flex w-full flex-col items-center bg-brand-primary-800 px-6 pt-40 pb-20 text-center">
        <div className="flex max-w-3xl flex-col items-center gap-4">
          <h1 className="font-heading text-[40px] leading-[1.15] font-bold text-brand-secondary-100 sm:text-[56px] sm:leading-[1.15]">Manage your tools.</h1>
          <p className="font-body text-[16px] leading-[26px] text-brand-secondary-100/80 sm:text-[20px] sm:leading-[28px]">
            Seven precision calculators for home buyers, investors, and real estate professionals across India&apos;s premier property markets.
          </p>
        </div>
      </section>

      <section className="flex w-full flex-col items-center gap-12 border-y border-brand-secondary-500 bg-brand-secondary-400 px-6 py-16 sm:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <p className="font-heading text-[14px] font-bold tracking-[1.2px] text-brand-primary-200 uppercase">Complete Toolkit</p>
          <h2 className="font-heading text-h2 font-bold text-brand-primary-500">Browse All Tools</h2>
          <p className="font-body text-[16px] leading-[24px] text-brand-primary-600/80">
            Verified calculators calibrated for Indian real estate: Bengaluru, Mumbai, and Delhi NCR.
          </p>
        </div>

        <div className="grid w-full max-w-350 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <ToolCardLink key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col items-center gap-10 bg-brand-green-200 px-6 py-16 sm:py-24 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        <div className="flex max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="font-heading text-[14px] font-bold tracking-[1.5px] text-[#334155] uppercase">Stay Ahead of the Market</p>
            <h2 className="font-heading text-h2 font-bold text-brand-primary-600">Get Immediate Real-Time Tools Access</h2>
            <p className="font-body text-[16px] leading-[26px] text-brand-primary-600/80">
              The premier properties in major metros are evaluated and snap-appraised inside hours. Ensure your design studio, agency, or investment fund is
              fully equipped with our real-time API.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-body flex items-center gap-2 text-[14px] text-brand-primary-600/80">✓ 14-day free trial on Pro</span>
            <span className="font-body flex items-center gap-2 text-[14px] text-brand-primary-600/80">✓ Cancel anytime</span>
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-brand-secondary-500 bg-brand-secondary-100 p-10 shadow-sm">
          <p className="font-heading text-[20px] font-bold text-brand-primary-600">Begin with a free trial</p>
          <input
            type="email"
            placeholder="Enter your email"
            disabled
            className="rounded-lg border border-brand-secondary-500 px-4 py-3 font-body text-[14px] text-brand-primary-600/50"
          />
          <button type="button" disabled className="rounded-lg bg-brand-primary-600 py-3 font-heading text-[14px] font-bold text-brand-secondary-100">
            Start Free Trial
          </button>
        </div>
      </section>
    </div>
  );
}
