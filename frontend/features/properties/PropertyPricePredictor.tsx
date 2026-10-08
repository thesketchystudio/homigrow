// features/properties/PropertyPricePredictor.tsx
// "Price Predictor" section at the bottom of the Property Details left
// column. No valuation model or market-comparables data exists yet, so the
// section renders a "Coming soon" card, styled like the Vaastu Compliance
// card, instead of a fabricated estimate.

import { Compass } from "lucide-react";

export function PropertyPricePredictor() {
  return (
    <div className="flex w-full flex-col gap-6 border-y border-[rgba(198,198,205,0.2)] py-8">
      <p className="font-heading text-[20px] font-bold text-brand-primary-600">Price Predictor</p>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-brand-secondary-500 bg-brand-secondary-400 py-10 text-center">
        <Compass className="size-6 text-brand-primary-300" />
        <p className="font-heading text-[14px] font-bold text-brand-primary-600">Coming soon</p>
      </div>
    </div>
  );
}
