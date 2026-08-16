// components/forms/AuthSelectField.tsx
// Underline-style labeled dropdown, the select counterpart to
// AuthTextField's text input — same label/underline/error styling,
// matching the Homigrow auth/onboarding Figma flow's dropdown fields
// (label + full-width underline with a chevron, no boxed border).

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AuthSelectFieldProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: string[];
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
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
