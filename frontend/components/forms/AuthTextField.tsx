// components/forms/AuthTextField.tsx
// Underline-style labeled text input bound to react-hook-form, matching
// the Homigrow auth/onboarding Figma flow (label + full-width underline,
// no boxed border). Shared across auth/post-property/profile forms that
// use this visual language (04_Frontend_Architecture.md forms pattern).

import { type UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

type AuthTextFieldProps = {
  label: string;
  placeholder?: string;
  type?: "text" | "email";
  error?: string;
  register: UseFormRegisterReturn;
  className?: string;
};

export function AuthTextField({ label, placeholder, type = "text", error, register, className }: AuthTextFieldProps) {
  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <label htmlFor={register.name} className="font-body font-bold text-[12px] leading-[18px] text-brand-primary-100">
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
