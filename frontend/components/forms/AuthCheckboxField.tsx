// components/forms/AuthCheckboxField.tsx
// Terms-agreement row: checkbox on the left, label text to its right,
// matching the signup form's layout. Wraps the shared shadcn Checkbox.

import { type UseFormRegisterReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type AuthCheckboxFieldProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  register: UseFormRegisterReturn;
  className?: string;
};

export function AuthCheckboxField({ label, checked, onCheckedChange, error, register, className }: AuthCheckboxFieldProps) {
  return (
    <div className={cn("flex flex-col w-full", className)}>
      <div className="flex items-start gap-4">
        <Checkbox
          id={register.name}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-invalid={Boolean(error)}
          className={cn("mt-[2px] size-4 rounded-[2px] border-brand-secondary-700 bg-background", error && "border-destructive")}
        />
        <label htmlFor={register.name} className="flex-1 font-heading text-[16px] leading-[24px] text-brand-secondary-800">
          {label}
        </label>
      </div>
      {error && <p className="pt-1 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
