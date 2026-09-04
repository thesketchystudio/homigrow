// features/auth/preferences/ChecklistGroup.tsx
// Checkbox rows with a title + sublabel (Figma "CheckRow" — development
// stage, current situation). True multi-select: several rows can be
// checked at once, matching the checkbox visual rather than forcing
// radio-button semantics onto it.

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type ChecklistOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type ChecklistGroupProps = {
  options: ChecklistOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  // Overrides for a denser presentation (e.g. the Post Property wizard's
  // Specifications sidebar, whose Figma "Curated Amenities" list uses a
  // small square checkbox with no row padding) — default matches the
  // original CheckRow look every other caller still uses.
  rowClassName?: string;
  checkboxClassName?: string;
  labelClassName?: string;
};

export function ChecklistGroup({
  options,
  value,
  onChange,
  className,
  rowClassName = "px-4 py-[14px]",
  checkboxClassName = "mt-1 size-5 rounded-none border-brand-secondary-900 data-[state=checked]:border-brand-primary-700 data-[state=checked]:bg-brand-primary-700 data-[state=checked]:text-background",
  labelClassName = "font-heading text-[16px] font-medium text-brand-primary-500",
}: ChecklistGroupProps) {
  const toggle = (optionValue: string, checked: boolean) => {
    onChange(checked ? [...value, optionValue] : value.filter((v) => v !== optionValue));
  };

  return (
    <div className={cn("flex w-full flex-col", className)}>
      {options.map((option) => {
        const checked = value.includes(option.value);
        return (
          <label key={option.value} className={cn("flex w-full cursor-pointer items-start gap-5", rowClassName)}>
            <Checkbox checked={checked} onCheckedChange={(next) => toggle(option.value, next === true)} className={checkboxClassName} />
            <div className="flex flex-col gap-0">
              <p className={labelClassName}>{option.label}</p>
              {option.sublabel && <p className="font-body text-[14px] text-brand-secondary-900">{option.sublabel}</p>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
