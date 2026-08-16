// features/auth/SignupFormStep.tsx
// Step 2 of 3 — "Welcome to the inner circle." signup form (Figma:
// SignUpScreen, node 416:913). Submits POST /auth/signup; server 422
// field errors are mapped back into react-hook-form via setError.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { signup, type TokenResponse } from "@/lib/api/endpoints/auth";
import { UserRole } from "@/lib/enums";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { AuthPhoneField } from "@/components/forms/AuthPhoneField";
import { AuthSelectField } from "@/components/forms/AuthSelectField";
import { AuthPasswordField } from "@/components/forms/AuthPasswordField";
import { AuthCheckboxField } from "@/components/forms/AuthCheckboxField";
import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { GoogleSignInButton } from "@/features/auth/GoogleSignInButton";
import { signupFormSchema, type SignupFormValues } from "@/lib/validation/auth";
import { CITY_NAMES, stateForCity } from "@/lib/data/indian-cities";

type SignupFormStepProps = {
  role: Exclude<UserRole, "admin">;
  onSuccess: (email: string) => void;
  onGoogleAuthSuccess: (session: TokenResponse) => void;
  onBack: () => void;
};

export function SignupFormStep({ role, onSuccess, onGoogleAuthSuccess, onBack }: SignupFormStepProps) {
  const isBroker = role === UserRole.broker;
  // A broker's Phase A has a 4th step (document upload) that doesn't
  // exist for a client — see AuthProgressBar.tsx.
  const totalSteps = isBroker ? 4 : 3;

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
  const selectedCity = watch("city");
  const password = watch("password") ?? "";
  const agreeToTerms = watch("agree_to_terms") ?? false;

  const handleCityChange = (city: string) => {
    setValue("city", city, { shouldValidate: true });
    setValue("state", stateForCity(city) ?? "", { shouldValidate: true });
  };

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
      city: values.city,
      state: values.state,
      ...(isBroker
        ? {
            company_name: values.company_name,
            rera_number: values.rera_number,
            service_area: values.service_area,
          }
        : {}),
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-10">
      <AuthProgressBar step={2} totalSteps={totalSteps} phase="onboarding" />

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
          <div className="flex flex-col gap-6">
            <GoogleSignInButton role={selectedRole} onSuccess={onGoogleAuthSuccess} />
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-brand-secondary-500" />
              <span className="font-heading text-[12px] tracking-[0.3px] text-brand-secondary-800/65">
                OR SIGN UP WITH EMAIL
              </span>
              <div className="h-px flex-1 bg-brand-secondary-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-11 sm:grid-cols-2">
            <AuthTextField label="Full Name" placeholder="Alexander Vance" register={register("full_name")} error={errors.full_name?.message} />
            <AuthTextField label="Email" type="email" placeholder="xyz@gmail.com" register={register("email")} error={errors.email?.message} />
          </div>

          <div className="grid grid-cols-1 gap-11 sm:grid-cols-3">
            <AuthPhoneField label="Phone number" placeholder="9876543210" register={register("phone")} error={errors.phone?.message} />
            <AuthSelectField
              label="City"
              placeholder="Select your city"
              value={selectedCity}
              onValueChange={handleCityChange}
              options={CITY_NAMES}
              error={errors.city?.message}
            />
            <AuthSelectField
              label="State"
              placeholder="State"
              value={watch("state")}
              onValueChange={() => {}}
              options={watch("state") ? [watch("state")] : []}
              disabled
              error={errors.state?.message}
            />
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

          {isBroker && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-black/10" />
                <span className="font-heading text-[16px] tracking-[1.5px] text-brand-secondary-800">
                  Verification Details
                </span>
                <div className="h-px flex-1 bg-black/10" />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <AuthTextField
                  label="Agency / Firm Name"
                  placeholder="Vance Realty Group"
                  register={register("company_name")}
                  error={errors.company_name?.message}
                />
                <AuthTextField
                  label="License / RERA No."
                  placeholder="RERA-MH-12345"
                  register={register("rera_number")}
                  error={errors.rera_number?.message}
                />
                <AuthTextField
                  label="City of Operation"
                  placeholder="Mumbai"
                  register={register("service_area")}
                  error={errors.service_area?.message}
                />
              </div>
            </div>
          )}
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

      <div className="flex w-full items-center gap-[462px]">
        <button
          type="button"
          onClick={onBack}
          className="flex flex-1 items-center justify-center rounded-[4px] border border-brand-primary-100 bg-background p-[17px] font-heading text-[16px] font-bold text-brand-primary-400"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={signupMutation.isPending}
          className="flex flex-1 items-center justify-center rounded-[4px] py-4 font-heading text-[16px] font-bold text-background disabled:opacity-60"
          style={{ backgroundImage: "linear-gradient(122.455deg, rgb(0, 0, 0) 0%, rgb(19, 27, 46) 100%)" }}
        >
          {signupMutation.isPending ? "Creating account…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
