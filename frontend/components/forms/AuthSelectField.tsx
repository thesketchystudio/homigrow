// components/forms/AuthSelectField.tsx
// Underline-style labeled dropdown, the select counterpart to
// AuthTextField's text input — same label/underline/error styling,
// matching the Homigrow auth/onboarding Figma flow's dropdown fields
// (label + full-width underline with a chevron, no boxed border).

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  // Mutually exclusive with `groups` below.
  options?: SelectOption[];
  // Grouped variant — renders a muted section header per group (e.g. the
  // Post Property wizard's "RESIDENTIAL" / "COMMERCIAL & LAND" Property
  // Type dropdown sections). Takes precedence over `options` when set.
  groups?: { label: string; options: SelectOption[] }[];
  error?: string;
  disabled?: boolean;
  className?: string;
  // Overrides the default label color — e.g. the Post Property wizard's
  // Figma labels are darker (rgba(26,26,26,0.8)) than the auth flow's.
  labelClassName?: string;
};

function normalizeOption(option: SelectOption) {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export function AuthSelectField({
  label,
  placeholder,
  value,
  onValueChange,
  options,
  groups,
  error,
  disabled,
  className,
  labelClassName,
}: AuthSelectFieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <span className={cn("font-body font-bold text-[12px] leading-[18px] text-brand-primary-100", labelClassName)}>{label}</span>
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
          {groups
            ? groups.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((option) => {
                    const { value: optionValue, label: optionLabel } = normalizeOption(option);
                    return (
                      <SelectItem key={optionValue} value={optionValue}>
                        {optionLabel}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              ))
            : (options ?? []).map((option) => {
                const { value: optionValue, label: optionLabel } = normalizeOption(option);
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
