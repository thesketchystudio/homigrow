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
// read-only, same as Location — the city/state collected at signup
// (P2-T21's City/State fields), displayed here as a single combined,
// non-editable "City, State" string read from `preferences.city`/`.state`
// (flat top-level keys, see auth_service.signup) rather than exposed as
// editable fields. The Buyer Profile section reads/writes
// `preferences.buyer_preferences` directly — the same structured object
// the signup wizard's 6-screen buyer-preference flow saves
// (features/auth/preferences/types.ts) — rather than maintaining its own
// separate flat keys, so a user's wizard answers and Account-tab edits
// are one shared dataset, not two disconnected copies. Only a subset of
// BuyerPreferences is editable here (budget, cities, property types,
// investment goals); the rest of the object (bedroom_preference,
// buy_timeline, exit_strategies, etc.) is preserved on save by spreading
// the existing object first.
// Figma also shows a "Last changed N months ago" note under Password —
// dropped, since nothing on the User model tracks a password-specific
// change timestamp (the generic updated_at column changes for unrelated
// edits too, so showing it here would be misleading).

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordDialog } from "@/features/profile/ChangePasswordDialog";
import { BudgetRangeSlider, BUDGET_MIN, BUDGET_MAX } from "@/features/auth/preferences/BudgetRangeSlider";
import { CityMultiSelectChips } from "@/features/auth/preferences/CityMultiSelectChips";
import { ChipMultiSelect, type ChipOption } from "@/features/auth/preferences/ChipMultiSelect";
import type { BuyerPreferences } from "@/features/auth/preferences/types";
import { ApiError } from "@/lib/api/client";
import { getMe, updateMe, type UserRead } from "@/lib/api/endpoints/users";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { accountFormSchema, type AccountFormValues } from "@/lib/validation/profile";

// Mirrors the option values PropertyTypeCardGrid/InvestmentGoalStep use
// (features/auth/preferences), as plain chips rather than the wizard's
// full-screen image cards/eyebrow labels — a compact settings form, not
// a dedicated preference screen.
const PROPERTY_TYPE_OPTIONS: ChipOption[] = [
  { value: "modernist_villas", label: "Modernist Villas" },
  { value: "luxury_penthouses", label: "Luxury Penthouses" },
  { value: "estates_mansions", label: "Estates & Mansions" },
  { value: "studio_lofts", label: "Studio Lofts" },
  { value: "serviced_apartments", label: "Serviced Apartments" },
  { value: "plots_land", label: "Plots & Land" },
  { value: "commercial_spaces", label: "Commercial Spaces" },
  { value: "farmhouses", label: "Farmhouses" },
];

const INVESTMENT_GOAL_OPTIONS: ChipOption[] = [
  { value: "rent_to_ownership", label: "Rent to Ownership" },
  { value: "long_term_investment", label: "Long-term Investment" },
  { value: "joint_investment_projects", label: "Joint-investment Projects" },
  { value: "capital_appreciation_play", label: "Capital Appreciation Play" },
  { value: "steady_yield_generation", label: "Steady Yield Generation" },
  { value: "business_infrastructure", label: "Business Infrastructure" },
];

function toFormValues(user: UserRead): AccountFormValues {
  const prefs = user.preferences ?? {};
  const buyerPreferences =
    typeof prefs.buyer_preferences === "object" && prefs.buyer_preferences !== null
      ? (prefs.buyer_preferences as BuyerPreferences)
      : {};
  return {
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    buyer_preferences: {
      budget_min: buyerPreferences.budget_min,
      budget_max: buyerPreferences.budget_max,
      preferred_cities: buyerPreferences.preferred_cities ?? [],
      property_types: buyerPreferences.property_types ?? [],
      investment_goals: buyerPreferences.investment_goals ?? [],
    },
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
    const existingBuyerPreferences =
      typeof user.preferences?.buyer_preferences === "object" && user.preferences.buyer_preferences !== null
        ? (user.preferences.buyer_preferences as BuyerPreferences)
        : {};
    mutation.mutate({
      full_name: values.full_name,
      email: values.email,
      preferences: {
        ...user.preferences,
        buyer_preferences: {
          ...existingBuyerPreferences,
          ...values.buyer_preferences,
        },
      },
    });
  };

  const city = typeof user.preferences?.city === "string" ? user.preferences.city : "";
  const state = typeof user.preferences?.state === "string" ? user.preferences.state : "";
  const locationLabel = [city, state].filter(Boolean).join(", ");

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
              value={user.phone ?? ""}
              placeholder="Not provided"
              disabled
              readOnly
              className="font-body text-brand-primary-400/50 border-b-[0.8px] border-[rgba(38,38,38,0.5)] bg-transparent px-4 py-3 text-[16px] leading-[26px] outline-none"
            />
            <p className="font-body text-[12px] text-slate-500">
              {user.phone ? "Contact support to change your phone number." : "No phone number on file (signed in with Google)."}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="location" className="font-heading text-brand-primary-400 text-[12px] font-bold tracking-[1.2px] uppercase">
              Location
            </label>
            <input
              id="location"
              value={locationLabel}
              placeholder="Not provided"
              disabled
              readOnly
              className="font-body text-brand-primary-400/50 border-b-[0.8px] border-[rgba(38,38,38,0.5)] bg-transparent px-4 py-3 text-[16px] leading-[26px] outline-none"
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

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-brand-primary-400 text-[20px] leading-[28px] font-bold">Buyer Profile</h2>
          <p className="font-body text-[12px] leading-[18px] text-slate-500">
            Help us personalise property recommendations for you — the same preferences you set during signup.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-heading text-brand-primary-400 text-[12px] font-bold tracking-[1.2px] uppercase">Budget Range</p>
          <Controller
            control={control}
            name="buyer_preferences"
            render={({ field }) => (
              <BudgetRangeSlider
                min={field.value.budget_min ?? BUDGET_MIN}
                max={field.value.budget_max ?? BUDGET_MAX}
                onChange={(budget_min, budget_max) => field.onChange({ ...field.value, budget_min, budget_max })}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-heading text-brand-primary-400 text-[12px] font-bold tracking-[1.2px] uppercase">Preferred Locations</p>
          <Controller
            control={control}
            name="buyer_preferences.preferred_cities"
            render={({ field }) => <CityMultiSelectChips value={field.value} onChange={field.onChange} />}
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-heading text-brand-primary-400 text-[12px] font-bold tracking-[1.2px] uppercase">Property Type</p>
          <Controller
            control={control}
            name="buyer_preferences.property_types"
            render={({ field }) => <ChipMultiSelect options={PROPERTY_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />}
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-heading text-brand-primary-400 text-[12px] font-bold tracking-[1.2px] uppercase">Buyer Intent</p>
          <Controller
            control={control}
            name="buyer_preferences.investment_goals"
            render={({ field }) => <ChipMultiSelect options={INVESTMENT_GOAL_OPTIONS} value={field.value} onChange={field.onChange} />}
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
