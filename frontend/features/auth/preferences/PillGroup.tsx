// features/auth/preferences/PillGroup.tsx
// Single-select pill row, black-fill when selected. Covers 4 visual
// shapes seen across the Figma frames: "compact" (bedroom count
// filters, single line, no sublabel), "labeled" (Figma "ChoicePill" —
// timeline/hold-period/risk-tolerance, left-aligned with a sublabel),
// "centered" (Figma "BHKPill" — target ROI, no sublabel, centered), and
// "filter" (Figma "Filter" component — Listings page sidebar's Lease
// Type/Amenities pills, rounded-[4px] rather than compact's rounded-[8px]).
// "labeled"/"centered" turn their label text green on selection (no
// checkmark — that's reserved for SelectableCardGroup's multi-select
// cards), matching the black-fill + green-text convention used there.

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PillOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type PillGroupBaseProps = {
  options: PillOption[];
  variant?: "compact" | "labeled" | "centered" | "filter";
  className?: string;
};

type PillGroupProps = PillGroupBaseProps &
  (
    | { multiple?: false; value: string | null; onChange: (value: string) => void }
    | { multiple: true; value: string[]; onChange: (value: string[]) => void }
  );

export function PillGroup(props: PillGroupProps) {
  const { options, variant = "labeled", className } = props;

  const isSelected = (optionValue: string) => (props.multiple ? props.value.includes(optionValue) : props.value === optionValue);

  const select = (optionValue: string) => {
    if (props.multiple) {
      props.onChange(props.value.includes(optionValue) ? props.value.filter((v) => v !== optionValue) : [...props.value, optionValue]);
    } else {
      props.onChange(optionValue);
    }
  };

  return (
    <div className={cn("flex w-full flex-wrap items-stretch gap-2", className)}>
      {options.map((option) => {
        const selected = isSelected(option.value);

        if (variant === "compact") {
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => select(option.value)}
              className={cn(
                "flex items-center gap-1.5 rounded px-6 py-2 font-heading text-[16px] font-medium",
                selected
                  ? "bg-brand-primary-600 text-brand-secondary-400"
                  : "border border-brand-secondary-500 bg-background text-brand-primary-600",
              )}
            >
              {option.label}
              {selected && <X size={12} strokeWidth={3} />}
            </button>
          );
        }

        if (variant === "filter") {
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => select(option.value)}
              className={cn(
                "rounded px-4 py-2 text-center font-heading text-[16px] font-medium",
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
              onClick={() => select(option.value)}
              className={cn(
                "flex flex-1 items-center justify-center rounded px-[21px] py-[13px] font-heading text-[14px]",
                selected
                  ? "border border-brand-primary-800 bg-brand-primary-800 text-brand-green-400"
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
            onClick={() => select(option.value)}
            className={cn(
              "flex flex-1 flex-col items-start gap-1 rounded-lg px-[25px] py-[21px] text-left",
              selected
                ? "border border-brand-primary-800 bg-brand-primary-800"
                : "border border-brand-secondary-500 bg-background",
            )}
          >
            <p className={cn("font-heading text-[16px]", selected ? "text-brand-green-400" : "text-brand-primary-500")}>{option.label}</p>
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
