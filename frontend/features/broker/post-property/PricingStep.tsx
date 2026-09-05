// features/broker/post-property/PricingStep.tsx
// Step 3 of the Post Property wizard (Figma "Curate Your Listing" >
// Pricing, node 619:2582). Fields use a local prefixed/suffixed underline
// input (PriceField) rather than Figma's raw boxed styling — it follows
// this wizard's established underline-field language (see AuthTextField/
// AuthPhoneField) instead of introducing a new visual system for one step.
// Deposit only applies to rent listings, and isn't part of Figma's (sale)
// frame. The Price Summary and Pricing Tip cards are pure arithmetic/static
// copy and match Figma; Market Benchmark (avg area price, days on market,
// price trend) needs comparable-listings analytics that don't exist yet,
// so it renders as a "Coming soon" placeholder instead of faking numbers —
// same pattern as MediaStep's Video & Virtual Tour section.
//
// Every numeric field is a controlled value/onChange pair driven by
// watch()/setValue() rather than a plain register() — needed so PriceField
// can live-format ₹ amounts with Indian comma grouping (toLocaleString's
// "en-IN" locale) as the broker types, not just on blur/submit.

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CalendarClock, Star, TrendingUp, Wallet } from "lucide-react";
import { PostPropertyStepper, type StepKey } from "@/features/broker/post-property/PostPropertyStepper";
import { FreePlanUsageBar } from "@/features/broker/post-property/FreePlanUsageBar";
import { ListingType, PAYMENT_STRUCTURE_LABELS, PaymentStructure, PRICE_FLEXIBILITY_LABELS, PriceFlexibility } from "@/lib/enums";
import { cn } from "@/lib/utils";
import { propertyPricingSchema, type PropertyPricingValues } from "@/lib/validation/postProperty";

type PricingStepProps = {
  listingType: ListingType;
  defaultValues: Partial<PropertyPricingValues> | null;
  onBack: () => void;
  onContinue: (values: PropertyPricingValues) => void;
  onStepSelect?: (step: StepKey) => void;
};

const FLEXIBILITY_OPTIONS = [PriceFlexibility.fixed, PriceFlexibility.negotiable, PriceFlexibility.highly_flexible] as const;
const FLEXIBILITY_HELPER: Record<PriceFlexibility, string> = {
  [PriceFlexibility.fixed]: "No negotiation",
  [PriceFlexibility.negotiable]: "Open to offers",
  [PriceFlexibility.highly_flexible]: "Price on request",
};

const PAYMENT_OPTIONS = [PaymentStructure.full_payment, PaymentStructure.emi_installments, PaymentStructure.construction_linked] as const;
// Figma's Payment Structure icons are traced brand artwork; these are generic
// payment concepts (lump sum / calendar / building), so a lucide equivalent
// is used instead — the same tradeoff this wizard already makes for Upload,
// Video, etc., versus PGDetailsSection's more specific room/AC glyphs.
const PAYMENT_ICONS: Record<PaymentStructure, typeof Wallet> = {
  [PaymentStructure.full_payment]: Wallet,
  [PaymentStructure.emi_installments]: CalendarClock,
  [PaymentStructure.construction_linked]: Building2,
};

function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const fieldLabelClassName = "font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80";

function PriceField({
  label,
  helperText,
  placeholder,
  prefix,
  unit,
  big,
  value,
  onChange,
  error,
  className,
}: {
  label: string;
  helperText?: string;
  placeholder?: string;
  prefix?: string;
  unit?: string;
  big?: boolean;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
  className?: string;
}) {
  // ₹ amounts are whole rupees, comma-grouped as you type (Indian lakh/crore
  // grouping); percentage fields (Stamp Duty, Brokerage %, etc.) keep raw
  // decimal input since 0-100 values don't need thousands grouping.
  const isAmount = prefix === "₹";

  const [text, setText] = useState(() => {
    if (value === undefined) return "";
    return isAmount ? value.toLocaleString("en-IN") : String(value);
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className={fieldLabelClassName}>{label}</span>
      <div className={cn("flex items-center gap-1 border-b pb-[15px] pt-[14px]", error ? "border-destructive" : "border-[rgba(198,198,205,0.3)]")}>
        {prefix && <span className={cn("shrink-0 font-heading text-brand-primary-600/40", big ? "text-[24px]" : "text-[16px]")}>{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          value={text}
          onChange={(event) => {
            const raw = event.target.value;
            if (isAmount) {
              const digits = raw.replace(/\D/g, "");
              setText(digits ? Number(digits).toLocaleString("en-IN") : "");
              onChange(digits ? Number(digits) : undefined);
            } else {
              // Digits with at most one decimal point.
              const cleaned = raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
              setText(cleaned);
              onChange(cleaned === "" || cleaned === "." ? undefined : Number(cleaned));
            }
          }}
          className={cn(
            "min-w-0 flex-1 bg-transparent font-heading text-foreground outline-none placeholder:text-brand-secondary-700",
            big ? "text-[24px]" : "text-[16px]",
          )}
        />
        {unit && <span className="shrink-0 font-heading text-[13px] text-brand-primary-600/40">{unit}</span>}
      </div>
      {helperText && <p className="font-body text-[11px] text-muted-foreground">{helperText}</p>}
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}

export function PricingStep({ listingType, defaultValues, onBack, onContinue, onStepSelect }: PricingStepProps) {
  const {
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
  const deposit = watch("deposit");
  const stampDutyPercent = watch("stamp_duty_percent");
  const registrationFeePercent = watch("registration_fee_percent");
  const brokeragePercent = watch("brokerage_percent");
  const totalCost = price + (pricePerSqft ?? 0) + (tokenAmount ?? 0);

  const onFormSubmit = handleSubmit(onContinue);

  return (
    <form onSubmit={onFormSubmit} className="flex w-full flex-col gap-8">
      <h1 className="font-heading text-[48px] font-bold leading-15 text-brand-primary-600">Post your listing</h1>

      <PostPropertyStepper current="pricing" onStepSelect={onStepSelect} />
      <FreePlanUsageBar />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-14 lg:col-span-2">
          <div className="flex flex-col gap-6">
            <h2 className="font-heading text-[20px] font-bold text-foreground">Core Pricing</h2>
            <PriceField
              label={isRent ? "Monthly Rent" : "Total Listing Price"}
              helperText={isRent ? "Enter the monthly rent for this property." : "Enter the total sale price for this property."}
              placeholder="4,50,00,000"
              prefix="₹"
              big
              value={watch("price")}
              onChange={(v) => setValue("price", v as number)}
              error={errors.price?.message}
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <PriceField
                label="Price Per Sq. Ft."
                helperText="Auto-calculated from total price + area"
                placeholder="10,000"
                prefix="₹"
                unit="/ SQ FT"
                value={pricePerSqft}
                onChange={(v) => setValue("price_per_sqft", v)}
                error={errors.price_per_sqft?.message}
              />
              <PriceField
                label="Token / Booking Amount"
                helperText="Initial amount to confirm the booking"
                placeholder="5,00,000"
                prefix="₹"
                value={tokenAmount}
                onChange={(v) => setValue("token_amount", v)}
                error={errors.token_amount?.message}
              />
            </div>
            {isRent && (
              <PriceField
                label="Security Deposit"
                placeholder="1,00,000"
                prefix="₹"
                value={deposit}
                onChange={(v) => setValue("deposit", v)}
                error={errors.deposit?.message}
              />
            )}
          </div>

          <div className="flex flex-col gap-5">
            <h2 className="font-heading text-[20px] font-bold text-foreground">Negotiation & Flexibility</h2>
            <div className="flex flex-col gap-2.5">
              <span className={fieldLabelClassName}>Price Flexibility</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {FLEXIBILITY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setValue("price_flexibility", option);
                      setValue("is_negotiable", option !== PriceFlexibility.fixed);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-[4px] border-2 px-3 py-[18px] text-center",
                      priceFlexibility === option ? "border-foreground" : "border-[rgba(198,198,205,0.35)]",
                    )}
                  >
                    <span className="font-heading text-[13px] font-bold text-foreground">{PRICE_FLEXIBILITY_LABELS[option]}</span>
                    <span className="font-body text-[11px] text-muted-foreground">{FLEXIBILITY_HELPER[option]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <h2 className="font-heading text-[20px] font-bold text-foreground">Payment Structure</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map((option) => {
                const Icon = PAYMENT_ICONS[option];
                const isActive = paymentStructure === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setValue("payment_structure", option)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 rounded-[4px] border-2 px-3 py-5",
                      isActive ? "border-foreground" : "border-[rgba(198,198,205,0.35)]",
                    )}
                  >
                    <Icon size={20} className="text-foreground/60" />
                    <span className="font-heading text-[13px] font-bold text-foreground">{PAYMENT_STRUCTURE_LABELS[option]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <h2 className="font-heading text-[20px] font-bold text-foreground">Additional Charges</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <PriceField
                label="Monthly Maintenance"
                helperText="Building / society maintenance fees"
                placeholder="15,000"
                prefix="₹"
                unit="/MO"
                value={maintenanceMonthly}
                onChange={(v) => setValue("maintenance_monthly", v)}
                error={errors.maintenance_monthly?.message}
              />
              <PriceField
                label="Stamp Duty"
                placeholder="5"
                unit="%"
                value={stampDutyPercent}
                onChange={(v) => setValue("stamp_duty_percent", v)}
                error={errors.stamp_duty_percent?.message}
              />
            </div>
            <PriceField
              label="Registration Fee"
              helperText="Property registration percentage"
              placeholder="1"
              unit="%"
              value={registrationFeePercent}
              onChange={(v) => setValue("registration_fee_percent", v)}
              error={errors.registration_fee_percent?.message}
            />
          </div>

          <div className="flex flex-col gap-5">
            <h2 className="font-heading text-[20px] font-bold text-foreground">Brokerage Details</h2>
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
              <span className="font-body text-[15px] text-foreground">Brokerage included in listing price</span>
            </div>
            <PriceField
              label="Brokerage Percentage"
              helperText="Your commission as % of transaction value"
              placeholder="2"
              unit="%"
              value={brokeragePercent}
              onChange={(v) => setValue("brokerage_percent", v)}
              error={errors.brokerage_percent?.message}
              className="max-w-[200px]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="flex flex-col gap-5 rounded-lg bg-muted p-7 shadow-sm">
            <h2 className="font-heading text-[14px] font-medium uppercase tracking-[1.4px] text-foreground">Price Summary</h2>
            <div className="flex flex-col gap-2.5">
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

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-foreground" />
              <h2 className="font-heading text-[14px] font-medium uppercase tracking-[1.4px] text-foreground">Market Benchmark</h2>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg bg-brand-secondary-400 py-8 text-center">
              <p className="font-heading text-[13px] font-bold text-brand-primary-600">Coming soon</p>
              <p className="max-w-[220px] font-body text-[11px] text-brand-primary-300">
                Comparable listings and area-average pricing will show up here once market data is wired in.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[4px] bg-foreground p-6">
            <div className="flex items-center gap-2">
              <Star size={12} className="text-background" />
              <h2 className="font-heading text-[11px] font-bold uppercase tracking-[1px] text-background">Pricing Tip</h2>
            </div>
            <p className="font-body text-[12px] text-background/75">
              Listings priced within 5% of the market average sell 2.1× faster. Include all charges upfront to build buyer trust.
            </p>
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
