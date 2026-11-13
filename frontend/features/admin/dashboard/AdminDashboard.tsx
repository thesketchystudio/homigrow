// features/admin/dashboard/AdminDashboard.tsx
// Admin Dashboard (Figma node 328:4): four KPI cards, the monthly views &
// leads trend, listings by type, the latest listings, quick actions and
// the recent admin activity feed — all from GET /admin/summary. KPI
// comparison lines describe exactly what was counted ("this month",
// "submitted today") rather than the design's period-over-period deltas,
// which the stored data can't reconstruct (no history of past counts).

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, Eye, House, IndianRupee, TrendingUp } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getAdminSummary, type AdminKpi } from "@/lib/api/endpoints/admin";
import { AdminCard, AdminLoadError, AdminPageHeader, AdminSectionLabel, AdminStatCard } from "@/features/admin/AdminChrome";
import { ListingsByTypeChart, TrafficChart } from "@/features/admin/dashboard/DashboardCharts";
import { RecentActivity } from "@/features/admin/dashboard/RecentActivity";
import { RecentListingsTable } from "@/features/admin/dashboard/RecentListingsTable";
import { formatRupeeAmount } from "@/features/admin/format";
import { ADMIN_SUMMARY_KEY } from "@/features/admin/queryKeys";

function KpiFooter({ kpi, format = (value) => value.toLocaleString("en-IN") }: { kpi: AdminKpi; format?: (value: number) => string }) {
  const delta = Number(kpi.delta);
  return (
    <span className="flex items-center gap-1.5 font-body text-[12px] text-slate-500">
      {delta > 0 && <TrendingUp size={12} className="text-emerald-600" />}
      <span className={delta > 0 ? "font-semibold text-emerald-600" : "font-semibold text-slate-500"}>
        {delta > 0 ? "+" : ""}
        {format(delta)}
      </span>
      {kpi.delta_label}
    </span>
  );
}

export function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ADMIN_SUMMARY_KEY, queryFn: getAdminSummary });

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader eyebrow="Admin Panel" title="Dashboard" subtitle="Overview of your property marketplace activity" />

      {isError && <AdminLoadError title="Couldn't load the dashboard" onRetry={() => refetch()} />}

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[154px] rounded-[6px]" />
          ))}
          <Skeleton className="h-[316px] rounded-[6px] sm:col-span-2 xl:col-span-4" />
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              label="Total Listings"
              value={Number(data.total_listings.value).toLocaleString("en-IN")}
              icon={<House size={14} />}
              footer={<KpiFooter kpi={data.total_listings} />}
            />
            <AdminStatCard
              label="Active Properties"
              value={Number(data.active_listings.value).toLocaleString("en-IN")}
              icon={<Eye size={14} />}
              footer={<KpiFooter kpi={data.active_listings} />}
            />
            <AdminStatCard
              label="Pending Reviews"
              value={Number(data.pending_reviews.value).toLocaleString("en-IN")}
              icon={<Clock size={14} />}
              footer={<KpiFooter kpi={data.pending_reviews} />}
            />
            <AdminStatCard
              label="Total Revenue"
              value={formatRupeeAmount(data.total_revenue.value)}
              icon={<IndianRupee size={14} />}
              footer={<KpiFooter kpi={data.total_revenue} format={(value) => formatRupeeAmount(value)} />}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <AdminCard className="flex flex-col gap-6 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <AdminSectionLabel>Traffic Overview</AdminSectionLabel>
                  <h2 className="font-heading text-[18px] font-bold text-brand-primary-600">Listing Views &amp; Leads</h2>
                </div>
                <div className="flex items-center gap-4 font-body text-[12px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-brand-primary-600" /> Views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-400" /> Leads
                  </span>
                </div>
              </div>
              <TrafficChart data={data.monthly_traffic} />
            </AdminCard>

            <AdminCard className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-1">
                <AdminSectionLabel>Distribution</AdminSectionLabel>
                <h2 className="font-heading text-[18px] font-bold text-brand-primary-600">Listings by Type</h2>
              </div>
              <ListingsByTypeChart data={data.listings_by_type} />
            </AdminCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <AdminCard className="flex flex-col overflow-hidden">
              <div className="flex items-end justify-between gap-3 px-6 pb-5 pt-6">
                <div className="flex flex-col gap-1">
                  <AdminSectionLabel>Latest</AdminSectionLabel>
                  <h2 className="font-heading text-[18px] font-bold text-brand-primary-600">Recent Listings</h2>
                </div>
                <Link
                  href="/admin/listings"
                  className="flex items-center gap-1.5 font-heading text-[12px] font-bold uppercase tracking-[1px] text-brand-primary-600"
                >
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <RecentListingsTable listings={data.recent_listings} />
            </AdminCard>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 rounded-[6px] bg-brand-primary-800 p-6">
                <span className="pb-2 font-heading text-[10px] font-bold uppercase tracking-[1.4px] text-background/50">
                  Quick Actions
                </span>
                <QuickAction href="/admin/review-queue" label="Review Pending Listings" count={Number(data.pending_reviews.value)} />
                <QuickAction href="/admin/users?role=broker" label="Broker Verifications" count={data.pending_broker_verifications} />
                <QuickAction href="/admin/users" label="All Users" />
              </div>
              <RecentActivity items={data.recent_activity} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuickAction({ href, label, count }: { href: string; label: string; count?: number }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[4px] bg-white/5 px-4 py-3 font-heading text-[14px] font-medium text-background transition-colors hover:bg-white/10"
    >
      {label}
      <span className="flex items-center gap-3">
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-brand-primary-800">{count}</span>
        )}
        <ArrowRight size={14} className="text-background/60" />
      </span>
    </Link>
  );
}
