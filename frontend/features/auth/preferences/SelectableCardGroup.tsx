// features/auth/preferences/SelectableCardGroup.tsx
// Bordered, multi-select cards (Figma "GoalCard" / exit-approach
// "Button" nodes) — black fill + green text when selected, optional
// small uppercase eyebrow above the title, optional checkmark badge
// (investment-goal cards show one; exit-approach cards rely on color
// alone).

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectableCardOption = {
  value: string;
  eyebrow?: string;
  label: string;
  sublabel?: string;
};

type SelectableCardGroupProps = {
  options: SelectableCardOption[];
  value: string[];
  onChange: (value: string[]) => void;
  showCheckIcon?: boolean;
  className?: string;
};

export function SelectableCardGroup({ options, value, onChange, showCheckIcon, className }: SelectableCardGroupProps) {
  const toggle = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  };

  return (
    <div className={cn("flex w-full flex-wrap gap-4", className)}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={cn(
              "relative flex min-h-[137px] flex-1 basis-[240px] flex-col items-start justify-center gap-3 rounded-lg border p-[29px] text-left",
              selected ? "border-brand-primary-700 bg-brand-primary-700" : "border-brand-secondary-500 bg-background",
            )}
          >
            {showCheckIcon && selected && (
              <div className="absolute right-[13px] top-[13px] flex size-[18px] items-center justify-center">
                <Check size={16} className="text-brand-green-400" />
              </div>
            )}
            {option.eyebrow && (
              <p className={cn("font-body text-[10px] font-bold uppercase tracking-[1px]", selected ? "text-brand-green-400" : "text-brand-primary-300")}>
                {option.eyebrow}
              </p>
            )}
            <p className={cn("font-heading text-[20px] tracking-[-0.4px]", selected ? "text-brand-green-400" : "text-brand-primary-500")}>
              {option.label}
            </p>
            {option.sublabel && (
              <p className={cn("font-body text-[12px]", selected ? "text-brand-secondary-700" : "text-brand-secondary-700")}>{option.sublabel}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
