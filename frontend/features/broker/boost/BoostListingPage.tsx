// features/broker/boost/BoostListingPage.tsx
// Boost Listing checkout (Figma "Real Estate Broker Portal > BoostListing",
// node 178:5300), reached from the Boost action on the Listings table or
// the Property Detail page. Plan/duration selection and pricing are real,
// backed by GET /boost-plans and POST /boost-orders; there is no payment
// gateway yet (a deliberate, current-scope decision), so "Launch Boost"
// only creates an order in "created" status and never charges anything —
// Payment Method below is inert for the same reason. Optional Add-ons has
// no backend model yet either, so it renders read-only, labeled coming soon.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  BedDouble,
  Camera,
  Check,
  Clock,
  Crown,
  Eye,
  Globe,
  MapPin,
  Phone,
  Share2,
  Sparkles,
  Star,
  Users2,
  Zap,
} from "lucide-react";

import ErrorState from "@/components/shared/ErrorState";
import StatusPill, { propertyStatusPillMap } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { createBoostOrder, listBoostPlans, type BoostPlan } from "@/lib/api/endpoints/boost";
import { getMyProperty } from "@/lib/api/endpoints/properties";
import { BoostTier } from "@/lib/enums";
import { cn, formatListingPrice } from "@/lib/utils";
import { toast } from "@/lib/toast";

type DurationDays = 7 | 15 | 30;

const DURATIONS: DurationDays[] = [7, 15, 30];
// Matches app/services/boost_service.py's DURATION_DISCOUNT_PERCENT/GST_PERCENT exactly —
// this is a client-side preview only; the server recomputes and freezes the real amount.
const DURATION_DISCOUNT_PERCENT: Record<DurationDays, number> = { 7: 0, 15: 10, 30: 20 };
const GST_PERCENT = 18;

const TIER_ICON: Record<BoostTier, typeof Zap> = { basic: Zap, featured: Star, premium: Crown };

const TIER_MULTIPLIER_LABEL: Record<BoostTier, string> = {
  basic: "2x more visibility",
  featured: "5x more visibility",
  premium: "10x more visibility",
};

const TIER_MULTIPLIER_CLASS: Record<BoostTier, string> = {
  basic: "bg-muted text-muted-foreground",
  featured: "bg-foreground/10 text-foreground",
  premium: "bg-amber-100 text-amber-800",
};

const TIER_RIBBON: Partial<Record<BoostTier, { label: string; className: string }>> = {
  featured: { label: "Most Popular", className: "bg-foreground text-background" },
  premium: { label: "Max Visibility", className: "bg-amber-400 text-amber-900" },
};

// No backend model exists for these yet — display-only, per explicit
// product decision to ship them as "coming soon" alongside this page.
const ADDONS = [
  { icon: Camera, name: "Professional Photos", description: "HD photo shoot by our team", price: 1499 },
  { icon: Share2, name: "Social Media Blast", description: "Posted to 50k+ follower accounts", price: 799 },
  { icon: BarChart3, name: "Weekly Analytics Report", description: "Detailed PDF every Monday", price: 299 },
  { icon: Globe, name: "Listing Microsite", description: "Custom URL for this property", price: 999 },
];

function roundRupees(value: number): number {
  return Math.round(value * 100) / 100;
}

function computePricing(pricePerDay: number, durationDays: DurationDays) {
  const base = pricePerDay * durationDays;
  const discountPercent = DURATION_DISCOUNT_PERCENT[durationDays];
  const discount = roundRupees((base * discountPercent) / 100);
  const subtotal = base - discount;
  const gst = roundRupees((subtotal * GST_PERCENT) / 100);
  const total = roundRupees(subtotal + gst);
  return { base, discount, subtotal, gst, total };
}

function formatRupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function StepHeading({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 items-center justify-center rounded-full bg-foreground font-heading text-[11px] font-medium text-background">
        {step}
      </span>
      <h2 className="font-heading text-[16px] font-medium text-foreground">{label}</h2>
    </div>
  );
}

export function BoostListingPage({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [duration, setDuration] = useState<DurationDays>(15);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");

  const {
    data: property,
    isLoading: propertyLoading,
    error: propertyError,
  } = useQuery({
    queryKey: ["broker-property-detail", propertyId],
    queryFn: () => getMyProperty(propertyId),
    retry: (failureCount, err) => (err instanceof ApiError && (err.status === 404 || err.status === 403) ? false : failureCount < 2),
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["boost-plans"],
    queryFn: listBoostPlans,
  });

  const selectedPlan: BoostPlan | null = useMemo(() => {
    if (!plans || plans.length === 0) return null;
    return plans.find((plan) => plan.id === selectedPlanId) ?? plans.find((plan) => plan.tier === BoostTier.featured) ?? plans[0];
  }, [plans, selectedPlanId]);

  const pricing = useMemo(() => (selectedPlan ? computePricing(selectedPlan.price, duration) : null), [selectedPlan, duration]);

  const createOrderMutation = useMutation({
    mutationFn: () => {
      if (!selectedPlan) throw new Error("No plan selected");
      return createBoostOrder({ property_id: propertyId, plan_id: selectedPlan.id, duration_days: duration });
    },
    onSuccess: () => {
      toast.success("Boost order placed — we'll follow up once payment is live.");
      router.push(`/broker/listings/${propertyId}`);
    },
    onError: () => toast.error("Couldn't create this boost order. Please try again."),
  });

  if (propertyError) {
    return (
      <ErrorState
        title="Couldn't load this listing"
        body="It may have been removed, or you don't have access to it."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="size-9 rounded-lg" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="font-heading text-[28px] font-medium text-foreground">Boost Listing</h1>
            <p className="font-body text-[15px] text-muted-foreground">Increase visibility and get more leads faster</p>
          </div>
        </div>

        {propertyLoading || !property ? (
          <Skeleton className="h-25 w-full rounded-lg" />
        ) : (
          <div className="flex items-center gap-4 rounded-lg border bg-card p-5">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {property.media[0]?.url && <img src={property.media[0].url} alt="" className="size-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <StatusPill value={property.status} map={propertyStatusPillMap} />
              <span className="font-heading text-[16px] font-medium text-foreground">{property.title}</span>
              <div className="flex flex-wrap items-center gap-3 font-body text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {property.locality}, {property.city}
                </span>
                {property.bhk != null && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="size-3.5" />
                    {property.bhk} BHK
                  </span>
                )}
                <span className="font-heading text-[14px] font-medium text-foreground">{formatListingPrice(property)}</span>
              </div>
            </div>
            <Link href="/broker/listings" className="font-body text-[13px] font-medium text-muted-foreground hover:underline">
              Change
            </Link>
          </div>
        )}

        <section className="flex flex-col gap-4">
          <StepHeading step={1} label="Choose a Boost Plan" />
          {plansLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-90 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {plans?.map((plan) => {
                const Icon = TIER_ICON[plan.tier];
                const ribbon = TIER_RIBBON[plan.tier];
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "relative flex flex-col gap-3 rounded-xl border bg-card p-5 text-left transition-colors",
                      isSelected ? "border-foreground" : "border-border hover:border-foreground/40",
                    )}
                  >
                    {ribbon && (
                      <span
                        className={cn(
                          "absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-1 font-body text-[10px] font-semibold whitespace-nowrap",
                          ribbon.className,
                        )}
                      >
                        {ribbon.label}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div className={cn("flex size-9 items-center justify-center rounded-lg", isSelected ? "bg-foreground/10" : "bg-muted")}>
                        <Icon className="size-4.5 text-foreground" />
                      </div>
                      {isSelected && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-foreground">
                          <Check className="size-3 text-background" />
                        </div>
                      )}
                    </div>
                    <span className="font-heading text-[15px] font-medium text-foreground">{plan.name}</span>
                    <div className="flex items-end gap-1">
                      <span className="font-heading text-[20px] font-bold text-foreground">{formatRupees(plan.price)}</span>
                      <span className="font-body text-[12px] text-muted-foreground">/day</span>
                    </div>
                    <span className={cn("w-fit rounded-md px-2 py-1 font-body text-[12px] font-semibold", TIER_MULTIPLIER_CLASS[plan.tier])}>
                      {TIER_MULTIPLIER_LABEL[plan.tier]}
                    </span>
                    <ul className="flex flex-col gap-1.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-1.5 font-body text-[12px] text-muted-foreground">
                          <Check className="mt-0.5 size-3.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <StepHeading step={2} label="Select Duration" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {DURATIONS.map((days) => {
              const discountPercent = DURATION_DISCOUNT_PERCENT[days];
              const cardPricing = selectedPlan ? computePricing(selectedPlan.price, days) : null;
              const isSelected = duration === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDuration(days)}
                  className={cn(
                    "relative flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors",
                    isSelected ? "border-foreground" : "border-border hover:border-foreground/40",
                  )}
                >
                  {discountPercent > 0 && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-2.5 py-1 font-body text-[10px] font-semibold whitespace-nowrap text-white">
                      {discountPercent}% off
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-foreground" />
                    <span className="font-heading text-[16px] font-medium text-foreground">{days} Days</span>
                  </div>
                  <span className="font-heading text-[20px] font-bold text-foreground">
                    {cardPricing ? formatRupees(cardPricing.subtotal) : "—"}
                  </span>
                  {selectedPlan && (
                    <span className="font-body text-[12px] text-muted-foreground">
                      {formatRupees(selectedPlan.price)}/day · {days} days
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <StepHeading step={3} label="Optional Add-ons (Coming soon)" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ADDONS.map((addon) => (
              <div
                key={addon.name}
                className="flex cursor-not-allowed items-center gap-3 rounded-xl border bg-card px-4 py-4 opacity-60"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <addon.icon className="size-4 text-foreground" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-body text-[13px] font-medium text-foreground">{addon.name}</span>
                  <span className="font-body text-[12px] text-muted-foreground">{addon.description}</span>
                </div>
                <span className="font-body text-[13px] font-medium text-muted-foreground">+{formatRupees(addon.price)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex w-full flex-col gap-6 lg:w-85 lg:shrink-0">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-green-600" />
            <h3 className="font-heading text-[15px] font-medium text-foreground">Expected Reach</h3>
          </div>
          {selectedPlan && (
            <>
              <div className="flex items-center justify-between font-body text-[13px]">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="size-4" />
                  Views
                </span>
                <span className="font-heading font-medium text-foreground">
                  {selectedPlan.reach_estimate.views_min.toLocaleString("en-IN")}–{selectedPlan.reach_estimate.views_max.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between font-body text-[13px]">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users2 className="size-4" />
                  Leads
                </span>
                <span className="font-heading font-medium text-green-600">
                  {selectedPlan.reach_estimate.leads_min}–{selectedPlan.reach_estimate.leads_max}
                </span>
              </div>
              <div className="flex items-center justify-between font-body text-[13px]">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" />
                  Calls
                </span>
                <span className="font-heading font-medium text-foreground">
                  {selectedPlan.reach_estimate.calls_min}–{selectedPlan.reach_estimate.calls_max}
                </span>
              </div>
              <p className="rounded-md bg-green-50 px-2.5 py-2 font-body text-[11px] text-green-700">
                Estimated over 15 days based on similar listings
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-5 rounded-xl border bg-card p-5">
          <h3 className="font-heading text-[15px] font-medium text-foreground">Order Summary</h3>
          {selectedPlan && pricing && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-body text-[13px]">
                <span className="text-muted-foreground">
                  {selectedPlan.name} · {duration} days
                </span>
                <span className="font-heading font-medium text-foreground">{formatRupees(pricing.base)}</span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex items-center justify-between font-body text-[13px]">
                  <span className="text-green-600">Duration discount ({DURATION_DISCOUNT_PERCENT[duration]}% off)</span>
                  <span className="font-heading font-medium text-green-600">−{formatRupees(pricing.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2 font-body text-[13px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-heading font-medium text-foreground">{formatRupees(pricing.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between font-body text-[13px]">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="font-heading font-medium text-foreground">{formatRupees(pricing.gst)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 font-body text-[14px] font-semibold">
                <span className="text-foreground">Total</span>
                <span className="font-heading text-[18px] font-bold text-foreground">{formatRupees(pricing.total)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="font-body text-[13px] font-medium text-foreground">Payment Method</span>
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left",
                paymentMethod === "card" ? "border-foreground bg-muted/40" : "border-border",
              )}
            >
              <span className={cn("flex size-4 items-center justify-center rounded-full border", paymentMethod === "card" ? "border-foreground" : "border-muted-foreground")}>
                {paymentMethod === "card" && <span className="size-2 rounded-full bg-foreground" />}
              </span>
              <span className="font-body text-[12px] font-medium text-foreground">Credit / Debit Card</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("upi")}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left",
                paymentMethod === "upi" ? "border-foreground bg-muted/40" : "border-border",
              )}
            >
              <span className={cn("flex size-4 items-center justify-center rounded-full border", paymentMethod === "upi" ? "border-foreground" : "border-muted-foreground")}>
                {paymentMethod === "upi" && <span className="size-2 rounded-full bg-foreground" />}
              </span>
              <span className="font-body text-[12px] font-medium text-foreground">UPI</span>
            </button>
            <p className="font-body text-[11px] text-muted-foreground">
              Payment integration is coming soon — placing this order won&apos;t charge you yet.
            </p>
          </div>

          <Button
            className="w-full bg-green-600 text-white hover:bg-green-700"
            disabled={!selectedPlan || !pricing || createOrderMutation.isPending}
            onClick={() => createOrderMutation.mutate()}
          >
            <Zap className="size-4" />
            {createOrderMutation.isPending ? "Placing order…" : `Launch Boost · ${pricing ? formatRupees(pricing.total) : "—"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
