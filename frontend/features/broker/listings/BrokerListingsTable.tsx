// features/broker/listings/BrokerListingsTable.tsx
// Real Listings table for the Broker Portal (Figma "Real Estate Broker
// Portal > MyListings", node 176:789): search + Type/Status filters, a
// property/location/price/details/performance/status/actions table, and
// pagination. Performance (views/leads) is hardcoded to 0/0 for now — no
// per-property view/lead-count aggregate exists on this table yet (the
// Property Detail page linked from the Property column has the real
// numbers, computed server-side). Each row's Boost action navigates to the
// real Boost Listing checkout (features/broker/boost/BoostListingPage.tsx);
// the header's Boost Listing button has no specific property in context, so
// it just points the broker at the table below. Edit opens the Post
// Property wizard in a new tab with the property id on the URL; the wizard
// itself doesn't read it yet (no prefill/update flow exists), this is
// navigation-only scaffolding for a follow-up task.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye, Pencil, Plus, TrendingUp, Users2 } from "lucide-react";

import SharedTable, { type TableColumn } from "@/components/shared/Table";
import StatusPill, { propertyStatusPillMap } from "@/components/shared/StatusPill";
import { BrokerEmptyState } from "@/features/broker/BrokerEmptyState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listMyProperties, type BrokerPropertyListItem } from "@/lib/api/endpoints/properties";
import { useAuthStore } from "@/lib/stores/auth";
import { LISTING_TYPE_LABELS, ListingType, PropertyStatus } from "@/lib/enums";
import { formatListedAgo, formatListingPrice } from "@/lib/utils";
import { toast } from "@/lib/toast";

const PAGE_SIZE = 10;

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  ...Object.values(ListingType).map((value) => ({ value, label: LISTING_TYPE_LABELS[value] })),
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  ...Object.values(PropertyStatus).map((value) => ({ value, label: propertyStatusPillMap[value].label })),
];

function handleBoostFromHeader() {
  toast.info("Pick a listing below to boost it.");
}

export function BrokerListingsTable() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError } = useQuery({ queryKey: ["broker-my-properties"], queryFn: listMyProperties });

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const listings = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return listings.filter((property) => {
      if (typeFilter !== "all" && property.listing_type !== typeFilter) return false;
      if (statusFilter !== "all" && property.status !== statusFilter) return false;
      if (query) {
        const haystack = `${property.title} ${property.locality} ${property.city}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [listings, search, typeFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  function updateTypeFilter(value: string) {
    setTypeFilter(value);
    setPage(1);
  }
  function updateStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  const columns: TableColumn<BrokerPropertyListItem>[] = [
    {
      key: "property",
      header: "Property",
      render: (property) => (
        <Link href={`/broker/listings/${property.id}`} className="flex items-center gap-3.5 hover:underline">
          <div className="size-6 shrink-0 overflow-hidden rounded-[4px] bg-muted">
            {property.cover_image_url && <img src={property.cover_image_url} alt="" className="size-full object-cover" />}
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-[14px] font-medium text-foreground">{property.title}</span>
            <span className="font-body text-[12px] text-muted-foreground">{formatListedAgo(property.created_at)}</span>
          </div>
        </Link>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (property) => (
        <span className="font-body text-[14px] text-muted-foreground">
          {property.locality}, {property.city}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (property) => <span className="font-heading text-[14px] font-medium text-foreground">{formatListingPrice(property)}</span>,
    },
    {
      key: "details",
      header: "Details",
      render: (property) =>
        property.bhk == null && property.area_sqft == null ? (
          <span className="font-body text-[13px] text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-col font-body text-[13px] text-muted-foreground">
            {property.bhk != null && <span>{property.bhk} BHK</span>}
            {property.area_sqft != null && <span>{property.area_sqft} sq.ft</span>}
          </div>
        ),
    },
    {
      key: "performance",
      header: "Performance",
      render: () => (
        <div className="flex items-center gap-3 font-body text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />0
          </span>
          <span className="flex items-center gap-1">
            <Users2 className="size-3.5" />0
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (property) => <StatusPill value={property.status} map={propertyStatusPillMap} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (property) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" className="size-8" aria-label="Edit listing" asChild>
            <Link href={`/broker/listings/${property.id}/edit`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="size-8" aria-label="Boost listing" asChild>
            <Link href={`/broker/listings/${property.id}/boost`}>
              <TrendingUp className="size-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  if (!isLoading && !isError && listings.length === 0) {
    return <BrokerEmptyState name={user?.full_name} />;
  }

  return (
    <div className="flex flex-col gap-[27px]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-medium text-foreground">Listings</h1>
          <p className="font-body text-[15px] text-muted-foreground">Manage all your property listings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-brand-primary-400 text-white hover:opacity-90" onClick={handleBoostFromHeader}>
            <TrendingUp className="size-4" />
            Boost Listing
          </Button>
          <Button asChild className="bg-brand-green-500 text-brand-primary-700 hover:opacity-90">
            <Link href="/broker/listings/new" target="_blank" rel="noopener noreferrer">
              <Plus className="size-4" />
              Add Listing
            </Link>
          </Button>
        </div>
      </div>

      <SharedTable
        columns={columns}
        data={pageItems}
        rowKey={(property) => property.id}
        isLoading={isLoading}
        error={isError ? "Couldn't load your listings. Please try again." : undefined}
        emptyTitle="No listings match your filters"
        emptyBody="Try adjusting your search or filters."
        searchValue={search}
        onSearchChange={updateSearch}
        filtersSlot={
          <>
            <Select value={typeFilter} onValueChange={updateTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={updateStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        pagination={{ page: currentPage, pageCount, onPageChange: setPage }}
      />
    </div>
  );
}
