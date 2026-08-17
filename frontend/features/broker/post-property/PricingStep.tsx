// features/broker/post-property/PricingStep.tsx
// Step 3 (final) of the Post Property wizard. Deposit only applies to
// rent listings. Fields map straight onto Property columns that already
// exist (price, maintenance_monthly, deposit, is_negotiable) — Figma's
// fuller Pricing screen (price/sqft, token amount, payment plan, stamp
// duty, brokerage) needs new model columns that don't exist yet, so
// those are deferred.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { PostPropertyStepper } from "@/features/broker/post-property/PostPropertyStepper";
import { ListingType } from "@/lib/enums";
import { cn, toOptionalNumber } from "@/lib/utils";
import { propertyPricingSchema, type PropertyPricingValues } from "@/lib/validation/postProperty";

type PricingStepProps = {
  listingType: ListingType;
  onBack: () => void;
  onSubmit: (values: PropertyPricingValues) => void;
  isSubmitting: boolean;
};

export function PricingStep({ listingType, onBack, onSubmit, isSubmitting }: PricingStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyPricingValues>({
    resolver: zodResolver(propertyPricingSchema),
    defaultValues: { is_negotiable: false },
  });

  const isNegotiable = watch("is_negotiable");
  const isRent = listingType === ListingType.rent;

  const onFormSubmit = handleSubmit(onSubmit);

  return (
    <form onSubmit={onFormSubmit} className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Set your price</h1>
        <p className="font-body text-[16px] text-muted-foreground">Review pricing before submitting your listing for review.</p>
      </div>

      <PostPropertyStepper current="pricing" />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <AuthTextField
          label={isRent ? "Monthly Rent (₹)" : "Total Price (₹)"}
          placeholder="1500000"
          register={register("price", { setValueAs: toOptionalNumber })}
          error={errors.price?.message}
        />
        {isRent && (
          <AuthTextField
            label="Security Deposit (₹)"
            placeholder="100000"
            register={register("deposit", { setValueAs: toOptionalNumber })}
            error={errors.deposit?.message}
          />
        )}
      </div>

      <AuthTextField
        label="Monthly Maintenance (₹, optional)"
        placeholder="2500"
        register={register("maintenance_monthly", { setValueAs: toOptionalNumber })}
        error={errors.maintenance_monthly?.message}
      />

      <div className="flex items-center justify-between">
        <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Negotiation</span>
        <div className="flex rounded-md border border-border p-1">
          {([false, true] as const).map((option) => (
            <button
              key={String(option)}
              type="button"
              onClick={() => setValue("is_negotiable", option)}
              className={cn(
                "rounded px-4 py-1.5 font-heading text-[14px] font-bold",
                isNegotiable === option ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {option ? "Negotiable" : "Fixed"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center justify-center rounded-[4px] border border-brand-primary-100 bg-background px-12 py-4 font-heading text-[16px] font-bold text-brand-primary-400 disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center rounded py-4 px-12 font-heading text-[16px] font-bold text-background disabled:opacity-60"
          style={{ backgroundImage: "linear-gradient(122.455deg, rgb(0, 0, 0) 0%, rgb(19, 27, 46) 100%)" }}
        >
          {isSubmitting ? "Posting…" : "Post Property"}
        </button>
      </div>
    </form>
  );
}
