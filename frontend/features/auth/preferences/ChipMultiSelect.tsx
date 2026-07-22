// features/auth/preferences/ChipMultiSelect.tsx
// Small pill chips with a checkmark badge when selected (Figma
// "AmenityChip" — Must-Have Amenities). Sharp corners, no border-radius,
// matching the Figma source exactly.

import { cn } from "@/lib/utils";

export type ChipOption = {
  value: string;
  label: string;
};

type ChipMultiSelectProps = {
  options: ChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
};

export function ChipMultiSelect({ options, value, onChange, className }: ChipMultiSelectProps) {
  const toggle = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  };

  return (
    <div className={cn("flex w-full flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={cn(
              "flex items-center gap-1.5 border px-[17px] py-[11px] font-body text-[12px] font-medium",
              selected ? "border-brand-green-400 bg-brand-green-400 text-brand-primary-800" : "border-brand-secondary-500 bg-background text-brand-primary-500",
            )}
          >
            {selected && <span className="text-[10px] font-semibold">✓</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
