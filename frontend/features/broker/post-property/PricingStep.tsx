// features/broker/post-property/PricingStep.tsx
// Step 3 of the Post Property wizard (Figma "Curate Your Listing" >
// Pricing). Deposit only applies to rent listings. The Price Summary
// sidebar is pure arithmetic from the form's own values (price + stamp
// duty + registration fee); Figma's Market Benchmark panel (avg area
// price, days on market, price trend) is intentionally left out — it
// needs comparable-listings analytics that don't exist yet, and faking
// those numbers would be worse than not showing the panel.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { PostPropertyStepper, type StepKey } from "@/features/broker/post-property/PostPropertyStepper";
import { FreePlanUsageBar } from "@/features/broker/post-property/FreePlanUsageBar";
import { ListingType, PAYMENT_STRUCTURE_LABELS, PaymentStructure, PRICE_FLEXIBILITY_LABELS, PriceFlexibility } from "@/lib/enums";
import { cn, toOptionalNumber } from "@/lib/utils";
import { propertyPricingSchema, type PropertyPricingValues } from "@/lib/validation/postProperty";

type PricingStepProps = {
  listingType: ListingType;
  defaultValues: Partial<PropertyPricingValues> | null;
  onBack: () => void;
  onContinue: (values: PropertyPricingValues) => void;
  onStepSelect?: (step: StepKey) => void;
};

const FLEXIBILITY_OPTIONS = [PriceFlexibility.fixed, PriceFlexibility.negotiable, PriceFlexibility.highly_flexible] as const;
const PAYMENT_OPTIONS = [PaymentStructure.full_payment, PaymentStructure.emi_installments, PaymentStructure.construction_linked] as const;

function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function PricingStep({ listingType, defaultValues, onBack, onContinue, onStepSelect }: PricingStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyPricingValues>({
    resolver: zodResolver(propertyPricingSchema),
    defaultValues: {
      is_negotiable: true,
      price_flexibility: PriceFlexibility.negotiable,
      payment_structure: PaymentStructure.full_payment,
      brokerage_included: true,
      ...defaultValues,
    },
  });

  const priceFlexibility = watch("price_flexibility");
  const paymentStructure = watch("payment_structure");
  const brokerageIncluded = watch("brokerage_included");
  const isRent = listingType === ListingType.rent;

  const price = watch("price") ?? 0;
  const pricePerSqft = watch("price_per_sqft");
  const tokenAmount = watch("token_amount");
  const maintenanceMonthly = watch("maintenance_monthly");
  const stampDutyPercent = watch("stamp_duty_percent") ?? 0;
  const registrationFeePercent = watch("registration_fee_percent") ?? 0;
  const totalCost = price > 0 ? price + (price * stampDutyPercent) / 100 + (price * registrationFeePercent) / 100 : 0;

  const onFormSubmit = handleSubmit(onContinue);

  return (
    <form onSubmit={onFormSubmit} className="flex w-full flex-col gap-8">
      <h1 className="font-heading text-[48px] font-bold leading-15 text-brand-primary-600">Post your listing</h1>

      <PostPropertyStepper current="pricing" onStepSelect={onStepSelect} />
      <FreePlanUsageBar />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-10 lg:col-span-2">
          <div className="flex flex-col gap-6">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Core Pricing</h2>
            <AuthTextField
              label={isRent ? "Monthly Rent (₹)" : "Total Listing Price (₹)"}
              placeholder="1500000"
              register={register("price", { setValueAs: toOptionalNumber })}
              error={errors.price?.message}
            />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <AuthTextField
                label="Price per Sq. Ft (₹, optional)"
                placeholder="10000"
                register={register("price_per_sqft", { setValueAs: toOptionalNumber })}
                error={errors.price_per_sqft?.message}
              />
              <AuthTextField
                label="Token / Booking Amount (₹, optional)"
                placeholder="500000"
                register={register("token_amount", { setValueAs: toOptionalNumber })}
                error={errors.token_amount?.message}
              />
            </div>
            {isRent && (
              <AuthTextField
                label="Security Deposit (₹)"
                placeholder="100000"
                register={register("deposit", { setValueAs: toOptionalNumber })}
                error={errors.deposit?.message}
              />
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-8">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Negotiation & Flexibility</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {FLEXIBILITY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setValue("price_flexibility", option);
                    setValue("is_negotiable", option !== PriceFlexibility.fixed);
                  }}
                  className={cn(
                    "rounded-md border p-4 text-left font-heading text-[14px] font-bold",
                    priceFlexibility === option ? "border-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  {PRICE_FLEXIBILITY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-8">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Payment Structure</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setValue("payment_structure", option)}
                  className={cn(
                    "rounded-md border p-4 text-left font-heading text-[14px] font-bold",
                    paymentStructure === option ? "border-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  {PAYMENT_STRUCTURE_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 border-t border-border pt-8">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Additional Charges</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <AuthTextField
                label="Monthly Maintenance (₹, optional)"
                placeholder="15000"
                register={register("maintenance_monthly", { setValueAs: toOptionalNumber })}
                error={errors.maintenance_monthly?.message}
              />
              <AuthTextField
                label="Stamp Duty (%, optional)"
                placeholder="5"
                register={register("stamp_duty_percent", { setValueAs: toOptionalNumber })}
                error={errors.stamp_duty_percent?.message}
              />
            </div>
            <AuthTextField
              label="Registration Fee (%, optional)"
              placeholder="1"
              register={register("registration_fee_percent", { setValueAs: toOptionalNumber })}
              error={errors.registration_fee_percent?.message}
            />
          </div>

          <div className="flex flex-col gap-6 border-t border-border pt-8">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Brokerage Details</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={brokerageIncluded}
                onClick={() => setValue("brokerage_included", !brokerageIncluded)}
                className={cn("h-6 w-11 rounded-full transition-colors", brokerageIncluded ? "bg-foreground" : "bg-muted")}
              >
                <span className={cn("block size-5 translate-x-0.5 rounded-full bg-background transition-transform", brokerageIncluded && "translate-x-5")} />
              </button>
              <span className="font-body text-[14px] text-foreground">Brokerage included in listing price</span>
            </div>
            <AuthTextField
              label="Brokerage Percentage (%, optional)"
              placeholder="2"
              register={register("brokerage_percent", { setValueAs: toOptionalNumber })}
              error={errors.brokerage_percent?.message}
              className="max-w-sm"
            />
            <p className="font-body text-[12px] text-muted-foreground">Your commission as % of transaction value</p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex flex-col gap-3 rounded-md border border-border p-6 lg:sticky lg:top-6">
            <h2 className="font-heading text-[16px] font-bold text-foreground">Price Summary</h2>
            <div className="flex items-center justify-between font-body text-[13px]">
              <span className="text-muted-foreground">Base Price</span>
              <span className="font-bold text-foreground">{formatInr(price)}</span>
            </div>
            {pricePerSqft !== undefined && (
              <div className="flex items-center justify-between font-body text-[13px]">
                <span className="text-muted-foreground">Price / Sq. Ft.</span>
                <span className="font-bold text-foreground">{formatInr(pricePerSqft)}</span>
              </div>
            )}
            {tokenAmount !== undefined && (
              <div className="flex items-center justify-between font-body text-[13px]">
                <span className="text-muted-foreground">Token Amount</span>
                <span className="font-bold text-foreground">{formatInr(tokenAmount)}</span>
              </div>
            )}
            {maintenanceMonthly !== undefined && (
              <div className="flex items-center justify-between font-body text-[13px]">
                <span className="text-muted-foreground">Maintenance</span>
                <span className="font-bold text-foreground">{formatInr(maintenanceMonthly)}/mo</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-3 font-body text-[13px]">
              <span className="text-muted-foreground">{isRent ? "Total Cost to Tenant" : "Total Cost to Buyer"}</span>
              <span className="font-bold text-foreground">{formatInr(totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center rounded-[4px] border border-brand-primary-100 bg-background px-12 py-4 font-heading text-[16px] font-bold text-brand-primary-400"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex items-center justify-center rounded py-4 px-12 font-heading text-[16px] font-bold text-background"
          style={{ backgroundImage: "linear-gradient(122.455deg, rgb(0, 0, 0) 0%, rgb(19, 27, 46) 100%)" }}
        >
          Continue
        </button>
      </div>
    </form>
  );
}
