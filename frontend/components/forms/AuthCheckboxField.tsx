// components/forms/AuthCheckboxField.tsx
// Terms-agreement row: label text on the left, checkbox on the right,
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
        <p className="flex-1 font-heading text-[16px] leading-[24px] text-brand-secondary-800">{label}</p>
        <Checkbox
          id={register.name}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-invalid={Boolean(error)}
          className={cn("mt-[2px] size-4 rounded-[2px]", error && "border-destructive")}
        />
      </div>
      {error && <p className="pt-1 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
