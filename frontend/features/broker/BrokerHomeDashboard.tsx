// features/broker/BrokerHomeDashboard.tsx
// Real broker Home/Dashboard (Figma "Real Estate Broker Portal" > Dashboard,
// node 176:2 on the file's "Broker view" page): 4 KPI stat cards, a Recent
// Leads preview table, and an Active Listings preview grid. Replaces the
// previous plain status-list placeholder (BrokerListingsPanel, now removed)
// once a broker has at least one listing; the "Blank screen" empty state
// (BrokerEmptyState) still covers the zero-listings case, unchanged.
//
// Active Listings/New Leads/Conversion Rate are real aggregates computed
// client-side from the broker's own properties + leads — both already
// fetched elsewhere in the portal (BrokerLayout, BrokerListingsTable,
// BrokerLeadsTable all query the same two endpoints), so this reuses the
// same query keys rather than adding a new aggregate backend endpoint.
// Total Views has no backing analytics on the backend at all — rendered as
// an honest "Coming soon" card rather than a fabricated number, matching
// this codebase's existing precedent (Vaastu compliance, Market Context,
// the Compare screen's Investment section, BrokerListingsTable's
// hardcoded-0 Performance column).

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Phone, Plus } from "lucide-react";

import SharedTable, { type TableColumn } from "@/components/shared/Table";
import StatusPill, { leadStatusPillMap } from "@/components/shared/StatusPill";
import PropertyCard from "@/components/shared/PropertyCard";
import { Button } from "@/components/ui/button";
import { BrokerEmptyState } from "@/features/broker/BrokerEmptyState";
import { AddLeadNoteDialog } from "@/features/broker/leads/LeadActionDialogs";
import { LEADS_QUERY_KEY } from "@/features/broker/leads/queryKey";
import { listLeads, type LeadListItem } from "@/lib/api/endpoints/leads";
import { listMyProperties } from "@/lib/api/endpoints/properties";
import { useAuthStore } from "@/lib/stores/auth";
import { LeadStatus, PropertyStatus } from "@/lib/enums";
import { cn, formatListingPrice, formatRelativeTime } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function withinLast(dateString: string, windowMs: number) {
  return Date.now() - new Date(dateString).getTime() <= windowMs;
}

type StatCardProps = {
  label: string;
  value: string;
  caption: string;
  captionTone: "positive" | "neutral";
};

function StatCard({ label, value, caption, captionTone }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-brand-secondary-500 bg-brand-secondary-100 p-5">
      <span className="font-body text-[14px] text-brand-primary-300">{label}</span>
      <span className="font-heading text-[28px] font-bold text-brand-primary-400">{value}</span>
      <span className={cn("font-body text-[12px] font-medium", captionTone === "positive" ? "text-brand-green-800" : "text-muted-foreground")}>
        {caption}
      </span>
    </div>
  );
}

export function BrokerHomeDashboard() {
  const user = useAuthStore((state) => state.user);
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ["broker-my-properties"],
    queryFn: listMyProperties,
  });
  const { data: leadsData, isLoading: leadsLoading } = useQuery({ queryKey: LEADS_QUERY_KEY, queryFn: listLeads });
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null);

  const properties = useMemo(() => propertiesData ?? [], [propertiesData]);
  const leads = useMemo(() => leadsData ?? [], [leadsData]);

  const stats = useMemo(() => {
    const activeListings = properties.filter((property) => property.status === PropertyStatus.active);
    const activeThisWeek = activeListings.filter((property) => withinLast(property.created_at, WEEK_MS)).length;
    const newLeads = leads.filter((lead) => lead.status === LeadStatus.new).length;
    const newLeadsLast24h = leads.filter((lead) => withinLast(lead.created_at, DAY_MS)).length;
    const closedWon = leads.filter((lead) => lead.status === LeadStatus.closed_won).length;
    const conversionRate = leads.length > 0 ? (closedWon / leads.length) * 100 : null;

    return { activeListings, activeThisWeek, newLeads, newLeadsLast24h, conversionRate };
  }, [properties, leads]);

  const recentLeads = useMemo(
    () => [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [leads],
  );

  const featuredListings = useMemo(() => stats.activeListings.slice(0, 4), [stats.activeListings]);

  const leadColumns: TableColumn<LeadListItem>[] = [
    {
      key: "name",
      header: "Name",
      render: (lead) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6]">
            <span className="font-heading text-[13px] font-medium text-brand-primary-400">
              {lead.contact_name?.trim().charAt(0).toUpperCase() || "?"}
            </span>
          </div>
          <span className="font-body text-[14px] font-medium text-foreground">{lead.contact_name ?? "Unknown"}</span>
        </div>
      ),
    },
    {
      key: "property",
      header: "Property Interest",
      render: (lead) => (
        <Link
          href={`/properties/${lead.property_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[14px] text-foreground hover:underline"
        >
          {lead.property_title}
        </Link>
      ),
    },
    {
      key: "budget",
      header: "Budget",
      render: (lead) => (
        <span className="font-heading text-[14px] font-medium text-foreground">
          {formatListingPrice({ listing_type: lead.property_listing_type, price: lead.property_price })}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (lead) => <span className="font-body text-[14px] text-muted-foreground">{lead.property_city}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (lead) => <StatusPill value={lead.status} map={leadStatusPillMap} />,
    },
    {
      key: "date",
      header: "Date",
      render: (lead) => <span className="font-body text-[12px] text-muted-foreground">{formatRelativeTime(lead.created_at)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (lead) => (
        <div className="flex items-center justify-end gap-2">
          {lead.contact_phone ? (
            <Button variant="outline" size="icon" className="size-8" aria-label="Call lead" asChild>
              <a href={`tel:${lead.contact_phone}`}>
                <Phone className="size-4" />
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="icon" className="size-8" aria-label="Call lead" disabled>
              <Phone className="size-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" className="size-8" aria-label="Add note" onClick={() => setNoteLeadId(lead.id)}>
            <MessageSquare className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const isLoading = propertiesLoading || leadsLoading;
  if (!isLoading && properties.length === 0) {
    return <BrokerEmptyState name={user?.full_name} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[28px] font-bold text-brand-primary-400">
            {timeOfDayGreeting()}, {user?.full_name?.trim().split(" ")[0] || "there"}
          </h1>
          <p className="font-body text-[16px] text-brand-primary-300">Here&apos;s what&apos;s happening with your properties today</p>
        </div>
        <Button asChild className="shrink-0 bg-brand-green-600 text-brand-primary-400 hover:opacity-90">
          <Link href="/broker/listings/new" target="_blank" rel="noopener noreferrer">
            <Plus className="size-4" />
            Add Listing
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Listings"
          value={String(stats.activeListings.length)}
          caption={`+${stats.activeThisWeek} this week`}
          captionTone={stats.activeThisWeek > 0 ? "positive" : "neutral"}
        />
        <StatCard
          label="New Leads"
          value={String(stats.newLeads)}
          caption={`+${stats.newLeadsLast24h} in the last 24 hours`}
          captionTone={stats.newLeadsLast24h > 0 ? "positive" : "neutral"}
        />
        <StatCard label="Total Views" value="—" caption="Coming soon" captionTone="neutral" />
        <StatCard
          label="Conversion Rate"
          value={stats.conversionRate === null ? "—" : `${stats.conversionRate.toFixed(1)}%`}
          caption={stats.conversionRate === null ? "No leads yet" : "Closed won ÷ total leads"}
          captionTone={stats.conversionRate !== null && stats.conversionRate > 0 ? "positive" : "neutral"}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-brand-secondary-500 bg-brand-secondary-100 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[16px] font-medium text-brand-primary-400">Recent Leads</h2>
          <Link href="/broker/leads" className="font-body text-[12px] font-medium text-brand-primary-400 hover:underline">
            View all →
          </Link>
        </div>
        <SharedTable
          columns={leadColumns}
          data={recentLeads}
          rowKey={(lead) => lead.id}
          isLoading={leadsLoading}
          emptyTitle="No leads yet"
          emptyBody="Leads will appear here once visitors enquire about your properties."
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[16px] font-medium text-brand-primary-400">Active Listings</h2>
          <Link href="/broker/listings" className="font-body text-[12px] font-medium text-brand-primary-300 hover:underline">
            View all →
          </Link>
        </div>
        {featuredListings.length === 0 ? (
          <p className="font-body text-[14px] text-muted-foreground">
            No active listings yet — once a listing goes live, it&apos;ll show up here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredListings.map((property) => (
              <PropertyCard
                key={property.id}
                size="sm"
                property={{
                  id: property.id,
                  title: property.title,
                  imageUrl: property.cover_image_url ?? "/homepage/modern-mansion.png",
                  price: formatListingPrice(property),
                  location: `${property.locality}, ${property.city}`,
                  bhk: property.bhk ?? undefined,
                  areaSqft: property.area_sqft ?? undefined,
                  href: `/properties/${property.id}`,
                }}
                badge={{
                  label: "Active",
                  style: { backgroundColor: "var(--brand-green-100)", color: "var(--brand-green-800)", borderColor: "var(--brand-green-500)" },
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AddLeadNoteDialog leadId={noteLeadId} onClose={() => setNoteLeadId(null)} />
    </div>
  );
}
