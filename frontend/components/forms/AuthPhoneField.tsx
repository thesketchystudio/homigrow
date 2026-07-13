// components/forms/AuthPhoneField.tsx
// Underline phone input with a fixed +91 prefix cell, matching the
// signup form's "Phone number" field in the Homigrow Figma design.

import { type UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

type AuthPhoneFieldProps = {
  label: string;
  placeholder?: string;
  error?: string;
  register: UseFormRegisterReturn;
  className?: string;
};

export function AuthPhoneField({ label, placeholder, error, register, className }: AuthPhoneFieldProps) {
  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <label htmlFor={register.name} className="font-body font-bold text-[12px] leading-[18px] text-brand-primary-100">
        {label}
      </label>
      <div className="flex items-start gap-3">
        <div className="w-[46px] shrink-0 border-b border-foreground pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground">
          +91
        </div>
        <input
          id={register.name}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-w-0 flex-1 border-b bg-transparent pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground outline-none placeholder:text-brand-secondary-700",
            error ? "border-destructive" : "border-foreground focus:border-brand-green-600",
          )}
          {...register}
        />
      </div>
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
