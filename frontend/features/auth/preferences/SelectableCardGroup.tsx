// features/auth/preferences/SelectableCardGroup.tsx
// Bordered, multi-select cards (Figma "GoalCard" / exit-approach
// "Button" nodes) — black fill + green text when selected, optional
// small uppercase eyebrow above the title, optional checkmark badge
// (investment-goal cards show one; exit-approach cards rely on color
// alone by default in Figma). Sizing is also per-frame: GoalCard is
// min-h-[137px]/p-[29px]/gap-[12px] with a 20px label, the exit-approach
// "Button" cards are h-[89px]/p-[23px]/gap-[4px] with a 14px label — a
// real, deliberate size difference between the two frames, not an
// oversight, so all of it is an override rather than a shared constant.

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
  cardPadding?: string;
  cardMinHeight?: string;
  cardGap?: string;
  labelClassName?: string;
  className?: string;
};

export function SelectableCardGroup({
  options,
  value,
  onChange,
  showCheckIcon,
  cardPadding = "p-[29px]",
  cardMinHeight = "min-h-[137px]",
  cardGap = "gap-3",
  labelClassName = "text-[20px] tracking-[-0.4px]",
  className,
}: SelectableCardGroupProps) {
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
              "relative flex flex-1 basis-[240px] flex-col items-start justify-center rounded-lg border text-left",
              cardPadding,
              cardMinHeight,
              cardGap,
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
            <p className={cn("font-heading", labelClassName, selected ? "text-brand-green-400" : "text-brand-primary-500")}>{option.label}</p>
            {option.sublabel && (
              <p className={cn("font-body text-[12px]", selected ? "text-brand-secondary-700" : "text-brand-secondary-700")}>{option.sublabel}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
