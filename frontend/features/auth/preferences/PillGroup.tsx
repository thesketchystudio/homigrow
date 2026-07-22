// features/auth/preferences/PillGroup.tsx
// Single-select pill row, black-fill when selected. Covers 3 visual
// shapes seen across the Phase B Figma frames: "compact" (bedroom count
// filters, single line, no sublabel), "labeled" (Figma "ChoicePill" —
// timeline/hold-period/risk-tolerance, left-aligned with a sublabel),
// and "centered" (Figma "BHKPill" — target ROI, no sublabel, centered).

import { cn } from "@/lib/utils";

export type PillOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type PillGroupProps = {
  options: PillOption[];
  value: string | null;
  onChange: (value: string) => void;
  variant?: "compact" | "labeled" | "centered";
  className?: string;
};

export function PillGroup({ options, value, onChange, variant = "labeled", className }: PillGroupProps) {
  return (
    <div className={cn("flex w-full flex-wrap items-stretch gap-2", className)}>
      {options.map((option) => {
        const selected = value === option.value;

        if (variant === "compact") {
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded px-6 py-2 font-heading text-[16px] font-medium",
                selected
                  ? "bg-brand-primary-600 text-brand-secondary-400"
                  : "border border-brand-secondary-500 bg-background text-brand-primary-600",
              )}
            >
              {option.label}
            </button>
          );
        }

        if (variant === "centered") {
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex flex-1 items-center justify-center rounded px-[21px] py-[13px] font-heading text-[14px]",
                selected
                  ? "border border-brand-primary-800 bg-brand-primary-800 text-background"
                  : "border border-brand-secondary-500 bg-background text-brand-primary-500",
              )}
            >
              {option.label}
            </button>
          );
        }

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 flex-col items-start gap-1 rounded-lg px-[25px] py-[21px] text-left",
              selected
                ? "border border-brand-primary-800 bg-brand-primary-800"
                : "border border-brand-secondary-500 bg-background",
            )}
          >
            <p className={cn("font-heading text-[16px]", selected ? "text-background" : "text-brand-primary-500")}>{option.label}</p>
            {option.sublabel && (
              <p className={cn("font-body text-[12px]", selected ? "text-brand-secondary-700" : "text-brand-secondary-900")}>
                {option.sublabel}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
