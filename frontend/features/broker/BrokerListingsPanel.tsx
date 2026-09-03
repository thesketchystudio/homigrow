// features/broker/BrokerListingsPanel.tsx
// Shared by the Dashboard and Listings pages, which currently show
// identical content (a real KPI dashboard and a full listings table are
// both future work) — fetches the broker's own properties across every
// status and renders the Figma "Blank screen" empty state when there are
// none, or a plain status list once there's at least one.

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { BrokerEmptyState } from "@/features/broker/BrokerEmptyState";
import { listMyProperties } from "@/lib/api/endpoints/properties";
import { useAuthStore } from "@/lib/stores/auth";
import { PropertyStatus } from "@/lib/enums";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<PropertyStatus, string> = {
  [PropertyStatus.draft]: "Draft",
  [PropertyStatus.pending]: "Pending review",
  [PropertyStatus.active]: "Active",
  [PropertyStatus.sold]: "Sold",
  [PropertyStatus.rented]: "Rented",
  [PropertyStatus.expired]: "Expired",
  [PropertyStatus.rejected]: "Rejected",
};

export function BrokerListingsPanel({ heading }: { heading: string }) {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useQuery({ queryKey: ["broker-my-properties"], queryFn: listMyProperties });

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-md bg-muted" />;
  }

  const listings = data ?? [];
  if (listings.length === 0) {
    return <BrokerEmptyState name={user?.full_name} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-[24px] font-bold text-foreground">{heading}</h1>
      <div className="flex flex-col divide-y divide-border rounded-md border border-border">
        {listings.map((property) => (
          <Link
            key={property.id}
            href={property.status === PropertyStatus.active ? `/properties/${property.id}` : "#"}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <span className="font-body text-[14px] text-foreground">{property.title}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-3 py-1 font-heading text-[12px] font-bold uppercase tracking-[0.5px]",
                property.status === PropertyStatus.active ? "bg-brand-green-100 text-brand-green-800" : "bg-muted text-muted-foreground",
              )}
            >
              {STATUS_LABELS[property.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
