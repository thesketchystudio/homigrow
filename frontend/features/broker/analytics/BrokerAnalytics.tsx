// features/broker/analytics/BrokerAnalytics.tsx
// Real broker Analytics page (Figma "Real Estate Broker Portal" > Analytics,
// node 177:1857). Every number here is real: Leads/property-type/city/
// revenue come from the Lead table (has always had timestamps); Views come
// from the new property_views log (see backend/app/models/property_view.py)
// added specifically to back this page — Property.views_count was a dead
// column, never incremented anywhere, which is why the Dashboard and
// Property Detail pages both show "Coming soon" for views instead of it.
// "vs previous period" is omitted (not "0%"/"∞%") whenever the prior period
// has no data to compare against — see analytics_service.py's _pct_change.
//
// Color palette: this design system has exactly two brand hues (a near-
// black/gray "primary" scale and one green "accent" scale, per
// app/globals.css) — the Figma mock for this exact page already draws its
// property-type legend from that same limited palette rather than
// introducing off-brand hues. Every slice here is always paired with a
// direct text label (name + %), never color-only identification.

"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Eye, IndianRupee, Phone, TrendingDown, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import SharedTable, { type TableColumn } from "@/components/shared/Table";
import ErrorState from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { BrokerEmptyState } from "@/features/broker/BrokerEmptyState";
import { getBrokerAnalytics, type AnalyticsRange, type TopListingItem } from "@/lib/api/endpoints/analytics";
import { listMyProperties } from "@/lib/api/endpoints/properties";
import { useAuthStore } from "@/lib/stores/auth";
import { PROPERTY_TYPE_LABELS } from "@/lib/enums";
import { cn, formatINR, formatListingPrice } from "@/lib/utils";

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "6m", label: "Last 6 months" },
];

// Alternates hue and lightness (dark-neutral, bright-green, light-neutral,
// dark-green) rather than stepping through one ramp at a time — two
// adjacent gray steps (e.g. primary-200/secondary-800) measure ΔE ~4 in
// OKLab, "hard to tell apart even with full color vision" per
// dataviz/scripts/validate_palette.js; this set measures ΔE >= 16.6 on every
// adjacent pair. Every slice is still always paired with a direct text
// label (name + %), since two of these four are still low-chroma neutrals.
const PROPERTY_TYPE_COLORS = ["var(--brand-primary-400)", "var(--brand-green-500)", "var(--brand-primary-100)", "var(--brand-green-900)"];
const MAX_PROPERTY_TYPE_SLICES = 4;

function KpiCard({
  icon: Icon,
  label,
  value,
  changePct,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  changePct: number | null;
}) {
  const isPositive = changePct !== null && changePct >= 0;
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg border border-brand-secondary-500 bg-brand-secondary-100 p-5">
      <div className="flex items-center justify-between">
        <span className="font-body text-[14px] text-brand-secondary-900">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-md bg-brand-secondary-400">
          <Icon className="size-4 text-brand-primary-300" />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-heading text-[28px] font-medium text-brand-primary-400">{value}</span>
        {changePct === null ? (
          <span className="font-body text-[12px] text-brand-secondary-900">No prior period to compare</span>
        ) : (
          <div className="flex items-center gap-1.5">
            {isPositive ? <TrendingUp className="size-3.5 text-brand-green-700" /> : <TrendingDown className="size-3.5 text-destructive" />}
            <span className={cn("font-body text-[12px] font-medium", isPositive ? "text-brand-green-700" : "text-destructive")}>
              {isPositive ? "+" : ""}
              {changePct}%
            </span>
            <span className="font-body text-[12px] text-brand-secondary-900">vs previous period</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-body text-[12px] text-brand-secondary-900">{label}</span>
    </div>
  );
}

function ChartCard({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg border border-brand-secondary-500 bg-brand-secondary-100 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-[16px] font-medium text-brand-primary-400">{title}</h2>
          <p className="font-body text-[13px] text-brand-secondary-900">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ChartEmpty({ body }: { body: string }) {
  return <p className="flex h-[160px] items-center justify-center text-center font-body text-[13px] text-brand-secondary-900">{body}</p>;
}

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid var(--brand-secondary-500)",
  background: "var(--brand-secondary-100)",
  fontSize: 12,
  fontFamily: "var(--font-body)",
};

export function BrokerAnalytics() {
  const user = useAuthStore((state) => state.user);
  const [range, setRange] = useState<AnalyticsRange>("30d");

  const { data: properties, isLoading: propertiesLoading } = useQuery({ queryKey: ["broker-my-properties"], queryFn: listMyProperties });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["broker-analytics", range],
    queryFn: () => getBrokerAnalytics(range),
  });

  const propertyTypeSlices = useMemo(() => {
    const items = data?.property_type_breakdown ?? [];
    const labeled = items.map((item) => ({ label: PROPERTY_TYPE_LABELS[item.property_type], count: item.count, percent: item.percent }));
    if (labeled.length <= MAX_PROPERTY_TYPE_SLICES) return labeled;

    const top = labeled.slice(0, MAX_PROPERTY_TYPE_SLICES - 1);
    const rest = labeled.slice(MAX_PROPERTY_TYPE_SLICES - 1);
    const other = {
      label: "Other",
      count: rest.reduce((sum, item) => sum + item.count, 0),
      percent: Math.round(rest.reduce((sum, item) => sum + item.percent, 0) * 10) / 10,
    };
    return [...top, other];
  }, [data]);

  const hasListings = (properties?.length ?? 0) > 0;
  if (!propertiesLoading && !hasListings) {
    return <BrokerEmptyState name={user?.full_name} body="No analytics yet. Add a property to start tracking performance." />;
  }

  if (isError) {
    return <ErrorState title="Couldn't load analytics" body="Please try again in a moment." />;
  }

  const listingColumns: TableColumn<TopListingItem>[] = [
    {
      key: "listing",
      header: "Listing",
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-body text-[13px] font-medium text-foreground">{item.title}</span>
          <span className="font-body text-[12px] text-muted-foreground">
            {item.locality}, {item.city}
          </span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (item) => <span className="font-heading text-[13px] font-medium text-foreground">{formatListingPrice(item)}</span>,
    },
    {
      key: "views",
      header: "Views",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Eye className="size-3.5 text-muted-foreground" />
          <span className="font-body text-[13px] text-foreground">{item.views}</span>
        </div>
      ),
    },
    {
      key: "leads",
      header: "Leads",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5 text-muted-foreground" />
          <span className="font-body text-[13px] text-foreground">{item.leads}</span>
        </div>
      ),
    },
    {
      key: "conversion",
      header: "Conversion",
      render: (item) => (
        <span className="rounded-full bg-brand-green-100 px-2.5 py-1 font-body text-[12px] font-medium text-brand-green-800">
          {item.conversion_rate}%
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <Link href={`/properties/${item.property_id}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${item.title}`}>
          <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-medium text-brand-primary-400">Analytics</h1>
          <p className="font-body text-[15px] text-brand-secondary-900">Track performance across all your listings and leads</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-brand-secondary-500 bg-brand-secondary-100 p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={cn(
                "rounded-md px-4 py-[7px] font-body text-[13px] font-medium whitespace-nowrap",
                range === option.value ? "bg-brand-primary-400 text-brand-secondary-100" : "text-brand-secondary-900 hover:text-brand-primary-400",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[110px] rounded-lg" />)
        ) : (
          <>
            <KpiCard icon={Eye} label="Total Views" value={data.kpis.total_views.toLocaleString("en-IN")} changePct={data.kpis.total_views_change_pct} />
            <KpiCard icon={Users} label="Total Leads" value={data.kpis.total_leads.toLocaleString("en-IN")} changePct={data.kpis.total_leads_change_pct} />
            <KpiCard icon={Phone} label="Enquiry Calls" value={data.kpis.enquiry_calls.toLocaleString("en-IN")} changePct={data.kpis.enquiry_calls_change_pct} />
            <KpiCard icon={IndianRupee} label="Est. Revenue" value={formatINR(data.kpis.est_revenue)} changePct={data.kpis.est_revenue_change_pct} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <ChartCard
          title="Views & Leads Trend"
          subtitle={range === "6m" ? "Monthly performance across all listings" : "Daily performance across all listings"}
          action={
            <div className="flex items-center gap-4">
              <LegendDot color="var(--brand-primary-400)" label="Views" />
              <LegendDot color="var(--brand-green-600)" label="Leads" />
            </div>
          }
        >
          {isLoading || !data ? (
            <Skeleton className="h-[220px] rounded-md" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.trend} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--brand-secondary-500)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--brand-secondary-900)" }} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tick={{ fontSize: 11, fill: "var(--brand-secondary-900)" }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--brand-primary-400)", fontWeight: 500 }} />
                <Line type="monotone" dataKey="views" name="Views" stroke="var(--brand-primary-400)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="var(--brand-green-600)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="w-full lg:max-w-[340px]">
          <ChartCard title="By Property Type" subtitle="Lead distribution by property type">
            {isLoading || !data ? (
              <Skeleton className="h-[220px] rounded-md" />
            ) : propertyTypeSlices.length === 0 ? (
              <ChartEmpty body="No leads yet in this period." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={propertyTypeSlices}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="var(--brand-secondary-100)"
                      strokeWidth={2}
                    >
                      {propertyTypeSlices.map((slice, index) => (
                        <Cell key={slice.label} fill={PROPERTY_TYPE_COLORS[index % PROPERTY_TYPE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {propertyTypeSlices.map((slice, index) => (
                    <div key={slice.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: PROPERTY_TYPE_COLORS[index % PROPERTY_TYPE_COLORS.length] }} />
                        <span className="font-body text-[13px] text-brand-primary-400">{slice.label}</span>
                      </div>
                      <span className="font-heading text-[13px] font-medium text-brand-primary-400">{slice.percent}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:max-w-[340px]">
          <ChartCard title="Leads by City" subtitle="Geographic lead distribution">
            {isLoading || !data ? (
              <Skeleton className="h-[200px] rounded-md" />
            ) : data.leads_by_city.length === 0 ? (
              <ChartEmpty body="No leads yet in this period." />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, data.leads_by_city.length * 32)}>
                <BarChart data={data.leads_by_city} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid horizontal={false} stroke="var(--brand-secondary-500)" />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: "var(--brand-secondary-900)" }} />
                  <YAxis type="category" dataKey="city" tickLine={false} axisLine={false} width={80} tick={{ fontSize: 12, fill: "var(--brand-primary-400)" }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--brand-secondary-400)" }} />
                  <Bar dataKey="count" name="Leads" fill="var(--brand-green-600)" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="flex-1 overflow-hidden rounded-lg border border-brand-secondary-500 bg-brand-secondary-100">
          <div className="flex items-center justify-between border-b border-brand-secondary-500 px-6 py-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-heading text-[16px] font-medium text-brand-primary-400">Top Performing Listings</h2>
              <p className="font-body text-[13px] text-brand-secondary-900">Ranked by lead conversion rate</p>
            </div>
            <Link href="/broker/listings" className="font-body text-[13px] font-medium text-brand-secondary-900 hover:text-brand-primary-400">
              View listings →
            </Link>
          </div>
          <div className="p-4">
            <SharedTable
              columns={listingColumns}
              data={data?.top_listings ?? []}
              rowKey={(item) => item.property_id}
              isLoading={isLoading}
              emptyTitle="No performance data yet"
              emptyBody="Once your listings get views and leads, they'll be ranked here."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
