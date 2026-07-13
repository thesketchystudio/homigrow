// features/auth/SignupFormStep.tsx
// Step 2 of 3 — "Welcome to the inner circle." signup form (Figma:
// SignUpScreen, node 416:913). Submits POST /auth/signup; server 422
// field errors are mapped back into react-hook-form via setError,
// per the forms pattern in 04_Frontend_Architecture.md.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { signup } from "@/lib/api/endpoints/auth";
import { UserRole } from "@/lib/enums";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { AuthPhoneField } from "@/components/forms/AuthPhoneField";
import { AuthPasswordField } from "@/components/forms/AuthPasswordField";
import { AuthCheckboxField } from "@/components/forms/AuthCheckboxField";
import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { signupFormSchema, type SignupFormValues } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

type SignupFormStepProps = {
  role: Exclude<UserRole, "admin">;
  onSuccess: (email: string) => void;
  onGoToLogin: () => void;
};

export function SignupFormStep({ role, onSuccess, onGoToLogin }: SignupFormStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { role, agree_to_terms: undefined },
  });

  const selectedRole = watch("role");
  const password = watch("password") ?? "";
  const agreeToTerms = watch("agree_to_terms") ?? false;

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: (_data, variables) => onSuccess(variables.email),
    onError: (error: ApiError) => {
      if (error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          setError(field as keyof SignupFormValues, { message });
        }
      }
    },
  });

  const onSubmit = handleSubmit((values) => {
    signupMutation.mutate({
      phone: values.phone,
      role: values.role,
      full_name: values.full_name,
      email: values.email,
      password: values.password,
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-10">
      <AuthProgressBar step={2} />

      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[36px] font-medium leading-[44px] text-brand-primary-700">
            Welcome to the inner circle.
          </h1>
          <p className="font-body text-[16px] leading-[26px] text-brand-secondary-900">
            Establish your digital identity in the Homigrow ecosystem.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-11 sm:grid-cols-2">
            <AuthTextField label="Full Name" placeholder="Alexander Vance" register={register("full_name")} error={errors.full_name?.message} />
            <AuthTextField label="Email" type="email" placeholder="xyz@gmail.com" register={register("email")} error={errors.email?.message} />
          </div>

          <div className="grid grid-cols-1 gap-11 sm:grid-cols-2">
            <AuthPhoneField label="Phone number" placeholder="9876543210" register={register("phone")} error={errors.phone?.message} />

            <div className="flex flex-col gap-2">
              <span className="font-heading text-[12px] font-medium uppercase tracking-[1.2px] text-brand-secondary-900">
                I am a…
              </span>
              <div className="flex h-[52px] gap-3">
                {([UserRole.client, UserRole.broker] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setValue("role", option, { shouldValidate: true })}
                    className={cn(
                      "flex-1 rounded font-heading text-[12px] font-semibold uppercase tracking-[1.4px] transition-colors",
                      selectedRole === option
                        ? "border-[1.5px] border-transparent bg-brand-green-400 text-brand-green-800"
                        : "border-[1.5px] border-black/[0.18] text-brand-secondary-900",
                    )}
                  >
                    {option === UserRole.client ? "Buyer" : "Broker"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
            <AuthPasswordField
              label="Password"
              placeholder="Min. 8 characters"
              register={register("password")}
              error={errors.password?.message}
              strengthValue={password}
            />
            <AuthPasswordField
              label="Confirm password"
              placeholder="Min. 8 characters"
              register={register("confirm_password")}
              error={errors.confirm_password?.message}
            />
          </div>
        </div>

        <AuthCheckboxField
          label="By continuing, you agree to our digital governance protocols and privacy framework."
          checked={agreeToTerms === true}
          onCheckedChange={(checked) => setValue("agree_to_terms", checked as true, { shouldValidate: true })}
          register={register("agree_to_terms")}
          error={errors.agree_to_terms?.message}
        />
      </div>

      {signupMutation.isError && !(signupMutation.error as ApiError).fields && (
        <p className="text-[14px] text-destructive">{(signupMutation.error as ApiError).message}</p>
      )}

      <div className="flex w-full items-center justify-between">
        <p className="font-heading text-[16px] text-brand-secondary-800">
          {"Have an account? "}
          <button type="button" onClick={onGoToLogin} className="font-bold text-foreground">
            Log in →
          </button>
        </p>
        <button
          type="submit"
          disabled={signupMutation.isPending}
          className="flex items-center gap-3 rounded-lg bg-brand-primary-500 px-12 py-4 font-heading text-[16px] font-bold text-background disabled:opacity-60"
        >
          {signupMutation.isPending ? "Creating account…" : "Continue →"}
        </button>
      </div>
    </form>
  );
}
