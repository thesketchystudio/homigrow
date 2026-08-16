// features/properties/saved/PortfolioReviewCta.tsx
// "Section - Ultimate CTA" (Figma node 133:3199), the banner at the
// bottom of the Saved screen: a dark gradient with a conference-room
// photo blended over it via mix-blend-overlay (same layer order as
// Figma — gradient first, then the image div with the blend applied to
// its own layer). Image downloaded locally to public/saved/ since Figma
// asset URLs expire after 7 days (same precedent as the Login screen's
// public/auth/brand-panel.png). No curator/concierge service exists to
// actually book a review, so the button toasts "coming soon" rather
// than linking anywhere — same pattern as the Property Details page's
// unbuilt "Redesign with AI"/"Download Market Report" actions.

"use client";

import { toast } from "@/lib/toast";

export function PortfolioReviewCta() {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-gradient-to-r from-[#222325] to-[#4b5264] opacity-95" />
      <div className="absolute inset-0 mix-blend-overlay">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative background image, no LCP/optimization need */}
        <img src="/saved/portfolio-review-bg.png" alt="" className="size-full object-cover" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="flex flex-col items-center gap-4">
          <h2 className="max-w-3xl font-heading text-[28px] font-bold text-brand-secondary-100 sm:text-[48px] sm:leading-[60px]">
            Transform your collection into a cohesive lifestyle investment.
          </h2>
          <p className="max-w-xl font-body text-[16px] text-brand-secondary-500 sm:text-[18px]">
            Our senior curators are available for a personal portfolio review and strategic consultation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.info("Portfolio reviews aren't available yet.")}
          className="rounded-xl bg-brand-secondary-100 px-12 py-5 font-heading text-[16px] font-bold text-[#575e70] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
        >
          Schedule a Portfolio Review
        </button>
      </div>
    </div>
  );
}
