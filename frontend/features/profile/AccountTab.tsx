// features/profile/AccountTab.tsx
// Account tab content (Figma node 145:4686 → "Account Information" +
// "Buyer Profile" sections). Colors/fonts/spacing pulled directly from
// Figma's get_design_context output for this node: underline-style
// fields (border-bottom only, not the boxed shadcn Input look), and
// near-black (brand-primary-600, #1a1a1a) primary buttons/headings, not
// the app's green --primary token — this screen's own design uses black
// for its primary actions, matching the signup/login pages' black CTA
// buttons rather than the shadcn scaffold default.
//
// Full Name/Email are real User columns; Phone Number has no update path
// on the backend (User.phone is immutable post-signup) so it renders
// read-only; Preferred Language and the Buyer Profile fields (Budget
// Range, Preferred Location, Property Type, Buyer Intent) have no
// dedicated columns and are stored in the free-form `preferences` JSONB
// blob the backend already exposes for exactly this purpose (P2-T20).
// Figma also shows a "Last changed N months ago" note under Password —
// dropped, since nothing on the User model tracks a password-specific
// change timestamp (the generic updated_at column changes for unrelated
// edits too, so showing it here would be misleading).

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordDialog } from "@/features/profile/ChangePasswordDialog";
import { ApiError } from "@/lib/api/client";
import { getMe, updateMe, type UserRead } from "@/lib/api/endpoints/users";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { accountFormSchema, type AccountFormValues } from "@/lib/validation/profile";

const LANGUAGE_OPTIONS = ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Marathi", "Other"];

function toFormValues(user: UserRead): AccountFormValues {
  const prefs = user.preferences ?? {};
  return {
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    preferred_language: typeof prefs.preferred_language === "string" ? prefs.preferred_language : "",
    budget_range: typeof prefs.budget_range === "string" ? prefs.budget_range : "",
    preferred_location: typeof prefs.preferred_location === "string" ? prefs.preferred_location : "",
    property_type: typeof prefs.property_type === "string" ? prefs.property_type : "",
    buyer_intent: typeof prefs.buyer_intent === "string" ? prefs.buyer_intent : "",
  };
}

export function AccountTab() {
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Keyed on user.id and only mounted once `user` is real: the form's
  // defaultValues are baked in at construction time instead of synced in
  // after the fact (react-hook-form's `values` option), since that sync
  // raced against Controller-bound fields (the Preferred Language select)
  // registering on the very first render — the Select would come up empty
  // even though the underlying data was correct.
  return <AccountForm key={user.id} user={user} />;
}

function AccountForm({ user }: { user: UserRead }) {
  const queryClient = useQueryClient();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: toFormValues(user),
  });

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(["me"], updated);
      reset(toFormValues(updated));
      toast.success("Profile updated.");
      if (user.is_email_verified && variables.email !== user.email) {
        toast.info("Your new email needs to be verified.");
      }
    },
    onError: (error: ApiError) => {
      if (error.code === "EMAIL_TAKEN") {
        setError("email", { message: error.message });
      } else if (error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          setError(field as keyof AccountFormValues, { message });
        }
      } else {
        toast.error(error.message);
      }
    },
  });

  const onSubmit = (values: AccountFormValues) => {
    mutation.mutate({
      full_name: values.full_name,
      email: values.email,
      preferences: {
        ...user.preferences,
        preferred_language: values.preferred_language,
        budget_range: values.budget_range,
        preferred_location: values.preferred_location,
        property_type: values.property_type,
        buyer_intent: values.buyer_intent,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-brand-primary-400 text-[36px] leading-[44px] font-bold">Settings</h1>
        <p className="font-body text-brand-primary-600/70 text-[16px] leading-[26px]">
          Manage your profile and account security.
        </p>
      </div>

      <section className="flex flex-col gap-6">
        <h2 className="font-heading text-brand-primary-400 text-[20px] leading-[28px] font-bold">Account Information</h2>
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
          <UnderlineField
            label="Full Name"
            id="full_name"
            register={register("full_name")}
            error={errors.full_name?.message}
          />
          <UnderlineField
            label="Email Address"
            id="email"
            type="email"
            register={register("email")}
            error={errors.email?.message}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="font-heading text-brand-primary-400 text-[12px] font-bold tracking-[1.2px] uppercase">
              Phone Number
            </label>
            <input
              id="phone"
              value={user.phone}
              disabled
              readOnly
              className="font-body text-brand-primary-400/50 border-b-[0.8px] border-[rgba(38,38,38,0.5)] bg-transparent px-4 py-3 text-[16px] leading-[26px] outline-none"
            />
            <p className="font-body text-[12px] text-slate-500">Contact support to change your phone number.</p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="preferred_language" className="font-heading text-brand-primary-400 text-[12px] font-bold tracking-[1.2px] uppercase">
              Preferred Language
            </label>
            <Controller
              control={control}
              name="preferred_language"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="preferred_language"
                    className="font-body text-brand-primary-400 h-auto w-full rounded-none border-0 border-b-[0.8px] border-[rgba(38,38,38,0.5)] bg-transparent px-4 py-3 text-[16px] leading-[26px] shadow-none focus-visible:ring-0"
                  >
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </section>

      <div className="h-px border-t-[0.8px] border-b-[0.8px] border-[#e2e9ec]" />

      <section className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-brand-primary-400 text-[16px] leading-[24px] font-bold">Password</h2>
          <p className="font-body text-[14px] leading-[22px] text-slate-500">Keep your account secure with a strong password.</p>
        </div>
        <button
          type="button"
          onClick={() => setPasswordDialogOpen(true)}
          className="bg-brand-secondary-500 text-brand-primary-400 font-heading rounded px-6 py-2.5 text-[16px] font-bold whitespace-nowrap"
        >
          Change Password
        </button>
      </section>

      <div className="h-px border-t-[0.8px] border-b-[0.8px] border-[#e2e9ec]" />

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-brand-primary-400 text-[20px] leading-[28px] font-bold">Buyer Profile</h2>
          <p className="font-body text-[12px] leading-[18px] text-slate-500">Help us personalise property recommendations for you.</p>
        </div>
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
          <UnderlineField
            label="Budget Range"
            id="budget_range"
            placeholder="e.g. ₹1 Cr – ₹5 Cr"
            register={register("budget_range")}
          />
          <UnderlineField
            label="Preferred Location"
            id="preferred_location"
            placeholder="e.g. Indiranagar, Koramangala"
            register={register("preferred_location")}
          />
          <UnderlineField
            label="Property Type"
            id="property_type"
            placeholder="e.g. Residential"
            register={register("property_type")}
          />
          <UnderlineField
            label="Buyer Intent"
            id="buyer_intent"
            placeholder="e.g. Investment + Self-Use"
            register={register("buyer_intent")}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => reset()}
          disabled={!isDirty || mutation.isPending}
          className="font-heading rounded border border-[rgba(38,38,38,0.3)] px-6 py-2.5 text-[16px] font-bold text-slate-500 disabled:opacity-50"
        >
          Discard Changes
        </button>
        <button
          type="submit"
          disabled={!isDirty || mutation.isPending}
          className="bg-brand-primary-600 text-background font-heading rounded px-6 py-2.5 text-[16px] font-bold disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <ChangePasswordDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />
    </form>
  );
}

function UnderlineField({
  label,
  id,
  type = "text",
  placeholder,
  register,
  error,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-heading text-brand-primary-400 text-[12px] font-bold tracking-[1.2px] uppercase">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(
          "font-body text-brand-primary-400 border-b-[0.8px] bg-transparent px-4 py-3 text-[16px] leading-[26px] outline-none placeholder:text-slate-400",
          error ? "border-destructive" : "border-[rgba(38,38,38,0.5)] focus:border-brand-primary-600",
        )}
        {...register}
      />
      {error && <p className="text-destructive font-body text-[12px]">{error}</p>}
    </div>
  );
}
