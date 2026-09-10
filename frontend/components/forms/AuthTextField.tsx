// components/forms/AuthTextField.tsx
// Underline-style labeled text input bound to react-hook-form, matching
// the Homigrow auth/onboarding Figma flow (label + full-width underline,
// no boxed border). Shared across auth/post-property/profile forms that
// use this visual language.

import { type UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

type AuthTextFieldProps = {
  label: string;
  placeholder?: string;
  type?: "text" | "email";
  error?: string;
  register: UseFormRegisterReturn;
  className?: string;
  // Overrides the default label color — e.g. the Post Property wizard's
  // Figma labels are darker (rgba(26,26,26,0.8)) than the auth flow's.
  labelClassName?: string;
};

export function AuthTextField({ label, placeholder, type = "text", error, register, className, labelClassName }: AuthTextFieldProps) {
  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <label htmlFor={register.name} className={cn("font-body font-bold text-[12px] leading-[18px] text-brand-primary-100", labelClassName)}>
        {label}
      </label>
      <input
        id={register.name}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full border-b bg-transparent pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground outline-none placeholder:text-brand-secondary-700",
          error ? "border-destructive" : "border-foreground focus:border-brand-green-600",
        )}
        {...register}
      />
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
