// features/properties/PropertyVaastuChecker.tsx
// "Vaastu Compliance" section (Figma node 166:3505). Figma shows a scored
// checklist (main entrance/plot shape/room facings each rated), but none
// of that per-room facing/plot-shape data is modeled on Property — there
// is nothing real to compute a score from. Rendered as an honest
// coming-soon card matching the header's exact styling/copy rather than
// fabricating a score or checklist for every property regardless of its
// actual layout.

import { Compass } from "lucide-react";

export function PropertyVaastuChecker() {
  return (
    <div className="flex w-full flex-col gap-6 border-y border-[rgba(198,198,205,0.2)] py-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-[20px] font-bold text-brand-primary-600">Vaastu Compliance</p>
          <p className="font-body text-[12px] text-brand-primary-300">Traditional architectural alignment assessment</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-lg bg-brand-secondary-400 py-10 text-center">
        <Compass className="size-6 text-brand-primary-300" />
        <p className="font-heading text-[14px] font-bold text-brand-primary-600">Coming soon</p>
        <p className="max-w-sm font-body text-[12px] text-brand-primary-300">
          We&apos;re building a real per-room Vaastu assessment. It&apos;ll show up here once it&apos;s ready.
        </p>
      </div>
    </div>
  );
}
