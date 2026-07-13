// components/forms/AuthPasswordField.tsx
// Underline password input with a show/hide toggle, matching the Figma
// signup form. Pass `strengthValue` to render the strength meter under
// the primary "Password" field only (not "Confirm password").

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { type UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";

type AuthPasswordFieldProps = {
  label: string;
  placeholder?: string;
  error?: string;
  register: UseFormRegisterReturn;
  strengthValue?: string;
  className?: string;
};

export function AuthPasswordField({ label, placeholder, error, register, strengthValue, className }: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <label htmlFor={register.name} className="font-body font-bold text-[12px] leading-[18px] text-brand-primary-100">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center border-b pb-[5px] pt-1",
          error ? "border-destructive" : "border-foreground focus-within:border-brand-green-600",
        )}
      >
        <input
          id={register.name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className="min-w-0 flex-1 bg-transparent font-heading text-[16px] leading-normal text-foreground outline-none placeholder:text-brand-secondary-700"
          {...register}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="shrink-0 pl-3 text-brand-secondary-700"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {strengthValue !== undefined && <PasswordStrengthMeter password={strengthValue} />}
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
