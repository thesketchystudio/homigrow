// features/broker/listings/BrokerPropertyDetail.tsx
// Broker Property Detail page (Figma "Real Estate Broker Portal > Property
// Detail", node 177:3345 — both frames on that node are the same page, just
// clipped to different heights) — reached by clicking a listing row in
// BrokerListingsTable. Performance numbers (Total Views, Leads Generated,
// Shortlisted) are real, computed backend-side from Property.views_count,
// the Lead table, and the SavedProperty watchlist join table
// (GET /properties/mine/{id}). There is no per-day view time series
// anywhere in the schema, so the "Views - Last 30 Days" chart renders an
// honest "Coming soon" placeholder instead of fabricated trend data — same
// call already made for Total Views on the broker Home dashboard
// (BrokerHomeDashboard.tsx). Boost Listing navigates to the real Boost
// Listing checkout (features/broker/boost/BoostListingPage.tsx). Closing
// (Mark as Sold/Rented) is reversible: a sold/rented listing shows a Reopen
// Listing action instead, recovering from an accidental click.

"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BedDouble, Building2, Car, Compass, Pencil, RotateCcw, Ruler, Sofa, TrendingUp } from "lucide-react";

import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ErrorState from "@/components/shared/ErrorState";
import StatusPill, { leadStatusPillMap } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrokerPropertyGallery } from "@/features/broker/listings/BrokerPropertyGallery";
import { ApiError } from "@/lib/api/client";
import { closeProperty, getMyProperty, reopenProperty, type BrokerPropertyLeadSummary } from "@/lib/api/endpoints/properties";
import { FURNISHING_LABELS, ListingType, PropertyStatus } from "@/lib/enums";
import { cn, formatListingPrice, formatRelativeTime } from "@/lib/utils";
import { toast } from "@/lib/toast";

function BrokerPropertyDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-80" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-11 w-64" />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="flex w-full flex-col gap-6 lg:w-[342px] lg:shrink-0">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

type SpecItem = { icon: ReactNode; label: string; value: string };

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-brand-secondary-500 bg-white p-6">
      <h2 className="font-heading text-[18px] font-medium text-brand-primary-400">{title}</h2>
      {children}
    </div>
  );
}

function PerformanceRow({ label, value, isFirst }: { label: string; value: string; isFirst?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1 py-4", !isFirst && "border-t border-brand-secondary-500")}>
      <span className="font-body text-[12px] text-brand-primary-300">{label}</span>
      <span className="font-heading text-[24px] font-medium text-brand-primary-400">{value}</span>
    </div>
  );
}

function RecentLeadRow({ lead }: { lead: BrokerPropertyLeadSummary }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-brand-secondary-100 px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6]">
          <span className="font-heading text-[13px] font-medium text-brand-primary-400">
            {lead.contact_name?.trim().charAt(0).toUpperCase() || "?"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-body text-[13px] font-medium text-brand-primary-400">{lead.contact_name ?? "Unknown"}</span>
          <span className="font-body text-[12px] text-brand-primary-300">{formatRelativeTime(lead.created_at)}</span>
        </div>
      </div>
      <StatusPill value={lead.status} map={leadStatusPillMap} />
    </div>
  );
}

export function BrokerPropertyDetail({ propertyId }: { propertyId: string }) {
  const queryClient = useQueryClient();
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [confirmReopenOpen, setConfirmReopenOpen] = useState(false);

  const { data: property, isLoading, error } = useQuery({
    queryKey: ["broker-property-detail", propertyId],
    queryFn: () => getMyProperty(propertyId),
    retry: (failureCount, err) => (err instanceof ApiError && (err.status === 404 || err.status === 403) ? false : failureCount < 2),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-property-detail", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["broker-my-properties"] });
      toast.success(property?.listing_type === ListingType.sale ? "Listing marked as sold." : "Listing marked as rented.");
    },
    onError: () => toast.error("Couldn't update this listing. Please try again."),
  });

  const reopenMutation = useMutation({
    mutationFn: () => reopenProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-property-detail", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["broker-my-properties"] });
      toast.success("Listing reopened and marked active.");
    },
    onError: () => toast.error("Couldn't reopen this listing. Please try again."),
  });

  if (isLoading) {
    return <BrokerPropertyDetailSkeleton />;
  }

  if (error || !property) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 403);
    return (
      <ErrorState
        title={notFound ? "Property not found" : "Couldn't load this property"}
        body={notFound ? "This listing may have been removed, or you don't have access to it." : "Please try again in a moment."}
        action={
          <Button asChild variant="outline">
            <Link href="/broker/listings">Back to Listings</Link>
          </Button>
        }
      />
    );
  }

  const closeLabel = property.listing_type === ListingType.sale ? "Mark as Sold" : "Mark as Rented";
  const closeVerb = property.listing_type === ListingType.sale ? "sold" : "rented";

  const specs: SpecItem[] = [];
  if (property.bhk != null) specs.push({ icon: <BedDouble className="size-4" />, label: "BHK", value: `${property.bhk} BHK` });
  if (property.area_sqft != null) specs.push({ icon: <Ruler className="size-4" />, label: "Carpet Area", value: `${property.area_sqft} sq.ft` });
  if (property.floor != null) {
    specs.push({
      icon: <Building2 className="size-4" />,
      label: "Floor",
      value: property.total_floors != null ? `${property.floor} / ${property.total_floors}` : `${property.floor}`,
    });
  }
  if (property.furnishing) specs.push({ icon: <Sofa className="size-4" />, label: "Furnishing", value: FURNISHING_LABELS[property.furnishing] });
  if (property.facing) specs.push({ icon: <Compass className="size-4" />, label: "Facing", value: property.facing });
  if (property.parking_slots != null) specs.push({ icon: <Car className="size-4" />, label: "Parking", value: `${property.parking_slots} Covered` });

  const [descriptionHook, ...descriptionRest] = (property.description ?? "").split(/\n\n+/).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/broker/listings" className="flex items-center gap-1.5 font-body text-[14px] text-brand-primary-300 hover:text-brand-primary-400">
        <ArrowLeft className="size-4" />
        Back to Listings
      </Link>

      <BrokerPropertyGallery media={property.media} title={property.title} status={property.status} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[32px] font-medium text-brand-primary-400">{property.title}</h1>
          <p className="font-body text-[15px] text-brand-primary-300">
            {property.locality}, {property.city}
          </p>
          <p className="font-heading text-[28px] font-medium text-brand-primary-400">{formatListingPrice(property)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/broker/listings/${property.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          {property.status === PropertyStatus.active && (
            <Button className="bg-brand-green-500 text-brand-primary-700 hover:opacity-90" onClick={() => setConfirmCloseOpen(true)}>
              {closeLabel}
            </Button>
          )}
          {(property.status === PropertyStatus.sold || property.status === PropertyStatus.rented) && (
            <Button variant="outline" onClick={() => setConfirmReopenOpen(true)}>
              <RotateCcw className="size-4" />
              Reopen Listing
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/broker/listings/${propertyId}/boost`}>
              <TrendingUp className="size-4" />
              Boost Listing
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {specs.length > 0 && (
            <SectionCard title="Property Details">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-brand-primary-300">
                      {spec.icon}
                      <span className="font-body text-[12px]">{spec.label}</span>
                    </div>
                    <span className="font-heading text-[15px] font-medium text-brand-primary-400">{spec.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {property.description && (
            <SectionCard title="Description">
              <div className="flex flex-col gap-3">
                <p className="font-body text-[14px] leading-[22.75px] text-brand-primary-400">{descriptionHook}</p>
                {descriptionRest.map((paragraph, index) => (
                  <p key={index} className="font-body text-[14px] leading-[22.75px] text-brand-primary-400">
                    {paragraph}
                  </p>
                ))}
              </div>
            </SectionCard>
          )}

          {property.amenities.length > 0 && (
            <SectionCard title="Amenities">
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-md border border-brand-secondary-500 bg-brand-secondary-100/50 px-3 py-2 font-body text-[13px] text-brand-primary-400"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-[342px] lg:shrink-0">
          <SectionCard title="Performance">
            <div className="flex flex-col">
              <PerformanceRow label="Total Views" value={String(property.views_count)} isFirst />
              <PerformanceRow label="Leads Generated" value={String(property.leads_count)} />
              <PerformanceRow label="Shortlisted" value={String(property.shortlisted_count)} />
            </div>
          </SectionCard>

          <SectionCard title="Views - Last 30 Days">
            <div className="flex h-32 items-center justify-center rounded-md bg-brand-secondary-100">
              <span className="font-body text-[13px] text-brand-primary-300">Coming soon</span>
            </div>
          </SectionCard>

          <SectionCard title="Recent Leads">
            {property.recent_leads.length === 0 ? (
              <p className="font-body text-[13px] text-brand-primary-300">No leads yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {property.recent_leads.map((lead) => (
                  <RecentLeadRow key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </SectionCard>

          <div className="flex flex-col gap-4 rounded-lg bg-brand-green-600 p-6">
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-[16px] font-medium text-white">Boost Your Listing</h3>
              <p className="font-body text-[13px] text-white/90">Get 3x more visibility and reach potential buyers faster</p>
            </div>
            <Button className="bg-white text-brand-green-700 hover:bg-white/90" asChild>
              <Link href={`/broker/listings/${propertyId}/boost`}>Upgrade Now</Link>
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCloseOpen}
        onOpenChange={setConfirmCloseOpen}
        title={`${closeLabel}?`}
        body={`This marks the listing as ${closeVerb} and removes it from active search results. You can reopen it from here if this was a mistake.`}
        confirmLabel={closeLabel}
        onConfirm={async () => {
          await closeMutation.mutateAsync();
        }}
      />

      <ConfirmDialog
        open={confirmReopenOpen}
        onOpenChange={setConfirmReopenOpen}
        title="Reopen this listing?"
        body="This marks the listing active again and makes it visible in search results."
        confirmLabel="Reopen Listing"
        onConfirm={async () => {
          await reopenMutation.mutateAsync();
        }}
      />
    </div>
  );
}
