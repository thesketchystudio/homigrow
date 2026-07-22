// features/auth/preferences/BudgetRangeSlider.tsx
// "Price Range" dual-thumb slider (₹50L–₹25Cr+) + Minimum/Target display
// boxes (Figma "PriceSlider", node 418:994). Wraps the existing shadcn
// Slider, already dual-thumb capable via value={[min, max]} — no new
// dependency needed.

import { Slider } from "@/components/ui/slider";
import { formatINR } from "@/lib/utils";

export const BUDGET_MIN = 50_00_000;
export const BUDGET_MAX = 25_00_00_000;
const BUDGET_STEP = 5_00_000;

type BudgetRangeSliderProps = {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
};

export function BudgetRangeSlider({ min, max, onChange }: BudgetRangeSliderProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Slider
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          value={[min, max]}
          onValueChange={([lo, hi]) => onChange(lo, hi)}
          className="**:data-[slot=slider-track]:h-px **:data-[slot=slider-track]:rounded-none **:data-[slot=slider-track]:bg-brand-secondary-300 **:data-[slot=slider-range]:rounded-none **:data-[slot=slider-range]:bg-brand-primary-700 **:data-[slot=slider-thumb]:size-4 **:data-[slot=slider-thumb]:rounded **:data-[slot=slider-thumb]:border-brand-primary-700 **:data-[slot=slider-thumb]:bg-brand-primary-700"
        />
        <div className="flex items-center justify-between">
          <p className="font-body text-[10px] font-bold uppercase tracking-[-0.3px] text-brand-secondary-800">{formatINR(BUDGET_MIN)}</p>
          <p className="font-body text-[10px] font-bold uppercase tracking-[-0.3px] text-brand-secondary-800">{formatINR(BUDGET_MAX)}+</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-2 rounded-lg bg-brand-secondary-500 p-5">
          <p className="font-body text-[9px] font-semibold uppercase tracking-[2.25px] text-brand-primary-400">Minimum</p>
          <p className="font-body text-[18px] font-semibold text-brand-primary-700">{formatINR(min)}</p>
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-lg border-b-2 border-brand-green-400 bg-brand-secondary-500 p-5">
          <p className="font-body text-[9px] font-semibold uppercase tracking-[2.25px] text-brand-primary-400">Target</p>
          <p className="font-body text-[18px] font-semibold text-brand-primary-700">{formatINR(max)}</p>
        </div>
      </div>
    </div>
  );
}
