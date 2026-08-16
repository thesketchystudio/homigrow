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
};

export function ChecklistGroup({ options, value, onChange, className }: ChecklistGroupProps) {
  const toggle = (optionValue: string, checked: boolean) => {
    onChange(checked ? [...value, optionValue] : value.filter((v) => v !== optionValue));
  };

  return (
    <div className={cn("flex w-full flex-col", className)}>
      {options.map((option) => {
        const checked = value.includes(option.value);
        return (
          <label key={option.value} className="flex w-full cursor-pointer items-start gap-5 px-4 py-[14px]">
            <Checkbox
              checked={checked}
              onCheckedChange={(next) => toggle(option.value, next === true)}
              className="mt-1 size-5 rounded-none border-brand-secondary-900 data-[state=checked]:border-brand-primary-700 data-[state=checked]:bg-brand-primary-700 data-[state=checked]:text-background"
            />
            <div className="flex flex-col gap-0">
              <p className="font-heading text-[16px] font-medium text-brand-primary-500">{option.label}</p>
              {option.sublabel && <p className="font-body text-[14px] text-brand-secondary-900">{option.sublabel}</p>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
