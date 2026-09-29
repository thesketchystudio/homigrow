// features/ai-tools/ToolSlider.tsx
// Labelled slider field (label + value chip + track + min/max captions)
// shared by every AI Tools calculator's input column (Figma's
// "SliderField" component, e.g. node 735:1843).

"use client";

import { Slider } from "@/components/ui/slider";

const sliderTrack =
  "**:data-[slot=slider-track]:h-1.5 **:data-[slot=slider-track]:bg-brand-secondary-500 **:data-[slot=slider-range]:bg-brand-primary-800 **:data-[slot=slider-thumb]:size-4 **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-brand-primary-800 **:data-[slot=slider-thumb]:bg-brand-secondary-100";

export function ToolSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  minLabel,
  maxLabel,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  minLabel?: string;
  maxLabel?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="font-heading text-[14px] font-medium text-brand-primary-500">{label}</span>
        <span className="rounded-lg border border-brand-secondary-500 bg-brand-secondary-400 px-3 py-1 font-heading text-[14px] font-bold text-brand-primary-600 whitespace-nowrap">
          {display}
        </span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className={sliderTrack} />
      <div className="flex justify-between">
        <span className="font-body text-[12px] text-brand-primary-100">{minLabel ?? min.toLocaleString("en-IN")}</span>
        <span className="font-body text-[12px] text-brand-primary-100">{maxLabel ?? max.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
