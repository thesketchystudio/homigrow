// features/admin/listings/AdminListings.tsx
// All Listings (Figma node 328:429): every listing in any status, with
// search, a status filter, a grid/list toggle and paging. Filter, search,
// broker, page and view live in the URL so a filtered view can be shared
// and the Users page can deep-link to one broker's listings. The design's
// "New Listing" / "Post Property" buttons are left out: posting is a
// broker action tied to a broker account, and admins have none.

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LayoutGrid, List, X } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";
import StatusPill from "@/components/shared/StatusPill";
import { Skeleton } from "@/components/ui/skeleton";
import { listAdminProperties, type AdminProperty } from "@/lib/api/endpoints/admin";
import { PROPERTY_TYPE_LABELS, PropertyStatus } from "@/lib/enums";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { AdminLoadError, AdminPageHeader } from "@/features/admin/AdminChrome";
import { AdminPager, AdminSearchInput, AdminSegmentedFilter } from "@/features/admin/AdminControls";
import { ADMIN_PILL_CLASS, adminPropertyStatusMap } from "@/features/admin/adminStatus";
import { formatAdminDate, formatAdminPrice, listingRef } from "@/features/admin/format";
import { ApproveListingDialog, RejectListingDialog, type ModerationTarget } from "@/features/admin/ModerationDialogs";
import { ADMIN_PROPERTIES_KEY } from "@/features/admin/queryKeys";
import {
  AdminListingActions,
  AdminListingCard,
  ListingSpecs,
  type ListingActionHandlers,
} from "@/features/admin/listings/AdminListingCard";

const PAGE_SIZE = 24;

type StatusFilter = "all" | PropertyStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: PropertyStatus.active, label: "Active" },
  { value: PropertyStatus.pending, label: "Pending" },
  { value: PropertyStatus.draft, label: "Draft" },
  { value: PropertyStatus.rejected, label: "Rejected" },
  { value: PropertyStatus.expired, label: "Expired" },
];

const VALID_STATUSES = new Set<string>(Object.values(PropertyStatus));

export function AdminListings() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status") ?? "all";
  const status: StatusFilter = VALID_STATUSES.has(statusParam) ? (statusParam as PropertyStatus) : "all";
  const brokerId = searchParams.get("broker_id") ?? undefined;
  const brokerName = searchParams.get("broker_name");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const view = searchParams.get("view") === "list" ? "list" : "grid";
  const urlQuery = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(urlQuery);
  const debouncedSearch = useDebouncedValue(search.trim());

  const [approveTarget, setApproveTarget] = useState<ModerationTarget | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ModerationTarget | null>(null);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Push a settled search term into the URL (and back to page 1).
  useEffect(() => {
    if (debouncedSearch === urlQuery) return;
    const next = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debouncedSearch, urlQuery, searchParams, pathname, router]);

  const query = {
    status: status === "all" ? undefined : status,
    q: urlQuery || undefined,
    broker_id: brokerId,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...ADMIN_PROPERTIES_KEY, query],
    queryFn: () => listAdminProperties(query),
    placeholderData: keepPreviousData,
  });

  const handlers: ListingActionHandlers = {
    onApprove: setApproveTarget,
    onReject: setRejectTarget,
    onFilterBroker: (id, name) => updateParams({ broker_id: id, broker_name: name, page: null }),
  };

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader eyebrow="Property Management" title="All Listings" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <AdminSearchInput value={search} onChange={setSearch} placeholder="Search listings…" />
          <AdminSegmentedFilter
            ariaLabel="Filter by status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => updateParams({ status: value === "all" ? null : value, page: null })}
          />
        </div>
        <div className="flex gap-1 rounded-[4px] bg-slate-200/70 p-1" role="group" aria-label="Layout">
          {(["grid", "list"] as const).map((mode) => {
            const Icon = mode === "grid" ? LayoutGrid : List;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                aria-label={mode === "grid" ? "Grid view" : "List view"}
                onClick={() => updateParams({ view: mode === "grid" ? null : "list" })}
                className={cn("rounded-[3px] p-1.5", view === mode ? "bg-white text-brand-primary-600 shadow-sm" : "text-slate-400")}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 font-body text-[13px] text-slate-500">
        <span>
          {data ? `${data.total.toLocaleString("en-IN")} ${data.total === 1 ? "listing" : "listings"} found` : " "}
        </span>
        {brokerId && (
          <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-brand-primary-600 shadow-sm">
            Broker: {brokerName || "selected broker"}
            <button
              type="button"
              aria-label="Clear broker filter"
              onClick={() => updateParams({ broker_id: null, broker_name: null, page: null })}
            >
              <X size={12} />
            </button>
          </span>
        )}
      </div>

      {isError && <AdminLoadError title="Couldn't load listings" onRetry={() => refetch()} />}

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-[420px] rounded-[6px]" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <EmptyState title="No listings match" body="Try a different search or status filter." />
      )}

      {data && data.items.length > 0 && view === "grid" && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((listing) => (
            <AdminListingCard key={listing.id} listing={listing} handlers={handlers} />
          ))}
        </div>
      )}

      {data && data.items.length > 0 && view === "list" && <ListingsListView listings={data.items} handlers={handlers} />}

      {data && <AdminPager page={page} totalPages={data.total_pages} onPageChange={(next) => updateParams({ page: String(next) })} />}

      <ApproveListingDialog target={approveTarget} onClose={() => setApproveTarget(null)} />
      <RejectListingDialog target={rejectTarget} onClose={() => setRejectTarget(null)} />
    </div>
  );
}

function ListingsListView({ listings, handlers }: { listings: AdminProperty[]; handlers: ListingActionHandlers }) {
  return (
    <div className="overflow-x-auto rounded-[6px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <table className="w-full min-w-[860px]">
        <thead className="border-b border-slate-100">
          <tr className="text-left font-heading text-[10px] font-bold uppercase tracking-[1.4px] text-slate-500">
            <th className="px-6 py-3">ID</th>
            <th className="px-6 py-3">Property</th>
            <th className="px-6 py-3">Broker</th>
            <th className="px-6 py-3">Price</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Submitted</th>
            <th className="px-6 py-3" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.id} className="border-b border-slate-100 last:border-0">
              <td className="px-6 py-4 font-heading text-[12px] font-bold text-slate-500">{listingRef(listing.id)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span className="font-heading text-[14px] font-bold text-brand-primary-600">{listing.title}</span>
                  <span className="font-body text-[12px] text-slate-500">
                    {PROPERTY_TYPE_LABELS[listing.property_type]} · {listing.locality}, {listing.city}
                  </span>
                  <ListingSpecs listing={listing} />
                </div>
              </td>
              <td className="px-6 py-4 font-body text-[13px] text-brand-primary-600">{listing.broker.full_name || listing.broker.email || "—"}</td>
              <td className="px-6 py-4 font-heading text-[14px] font-bold text-brand-primary-600">
                {formatAdminPrice(listing.price, listing.listing_type)}
              </td>
              <td className="px-6 py-4">
                <StatusPill value={listing.status} map={adminPropertyStatusMap} className={ADMIN_PILL_CLASS} />
              </td>
              <td className="px-6 py-4 font-body text-[13px] text-slate-500">{formatAdminDate(listing.created_at)}</td>
              <td className="px-6 py-4 text-right">
                <AdminListingActions listing={listing} handlers={handlers} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
