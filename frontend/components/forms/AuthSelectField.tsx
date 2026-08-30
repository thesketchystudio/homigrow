// components/forms/AuthSelectField.tsx
// Underline-style labeled dropdown, the select counterpart to
// AuthTextField's text input — same label/underline/error styling,
// matching the Homigrow auth/onboarding Figma flow's dropdown fields
// (label + full-width underline with a chevron, no boxed border).

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SelectOption = string | { value: string; label: string };

type AuthSelectFieldProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onValueChange: (value: string) => void;
  // Plain strings when the value and its display label are the same
  // (e.g. a city name); { value, label } pairs when they diverge (e.g.
  // an enum key like "independent_house" displayed as "Independent House").
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  className?: string;
};

export function AuthSelectField({
  label,
  placeholder,
  value,
  onValueChange,
  options,
  error,
  disabled,
  className,
}: AuthSelectFieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <span className="font-body font-bold text-[12px] leading-[18px] text-brand-primary-100">{label}</span>
      <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          aria-invalid={Boolean(error)}
          className={cn(
            "h-auto w-full rounded-none border-0 border-b bg-transparent px-0 pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground shadow-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100",
            error ? "border-destructive" : "border-foreground focus:border-brand-green-600",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const { value: optionValue, label: optionLabel } = typeof option === "string" ? { value: option, label: option } : option;
            return (
              <SelectItem key={optionValue} value={optionValue}>
                {optionLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
