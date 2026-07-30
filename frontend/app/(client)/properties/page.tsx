// app/(client)/properties/page.tsx
// Listings/search screen (Figma "Curated Listings", node 28:646;
// 10_Phase_3.md P3-T10's frontend follow-up). Public route, no
// AuthGuard — GET /properties is unauthenticated. Filter state lives in
// local component state only (not synced to the URL) — a deliberate,
// smaller-scope choice for this first pass; not yet linked from the
// homepage/PropertyCard, that's a separate later task.

"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import ErrorState from "@/components/shared/ErrorState";
import { FilterSidebar } from "@/features/properties/listings/FilterSidebar";
import { ListingsToolbar } from "@/features/properties/listings/ListingsToolbar";
import { ListingsGrid, ListingsGridSkeleton } from "@/features/properties/listings/ListingsGrid";
import { ListingsPagination } from "@/features/properties/listings/ListingsPagination";
import { DEFAULT_FILTERS, type ListingsFilters, type SortValue } from "@/features/properties/listings/types";
import { listProperties, type PropertyListParams } from "@/lib/api/endpoints/properties";

const PAGE_SIZE = 12;

function toListParams(filters: ListingsFilters, sort: SortValue, page: number): PropertyListParams {
  return {
    // Only sent once the user actually moves the slider off its resting
    // extremes — the default ₹50L–₹15Cr range is meaningless for rent/PG
    // listings, whose `price` is a monthly figure (e.g. ₹18,000), and
    // would otherwise silently exclude them from the very first load.
    price_min: filters.priceMin > DEFAULT_FILTERS.priceMin ? filters.priceMin : undefined,
    price_max: filters.priceMax < DEFAULT_FILTERS.priceMax ? filters.priceMax : undefined,
    bhk_min: filters.bhkMin ?? undefined,
    listing_type: filters.listingType ?? undefined,
    property_type: filters.propertyTypes.length > 0 ? filters.propertyTypes : undefined,
    amenities: filters.amenities.length > 0 ? filters.amenities : undefined,
    sort,
    page,
    page_size: PAGE_SIZE,
  };
}

export default function PropertiesListingsPage() {
  const [filters, setFilters] = useState<ListingsFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortValue>("newest");
  const [page, setPage] = useState(1);

  const params = toListParams(filters, sort, page);
  const { data, isLoading, isPlaceholderData, error } = useQuery({
    queryKey: ["properties", params],
    queryFn: () => listProperties(params),
    placeholderData: keepPreviousData,
  });

  const updateFilters = (next: ListingsFilters) => {
    setFilters(next);
    setPage(1);
  };

  const updateSort = (next: SortValue) => {
    setSort(next);
    setPage(1);
  };

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-8 px-6 pt-28 pb-20 lg:flex-row lg:gap-0">
      <FilterSidebar filters={filters} onChange={updateFilters} />

      <div className="flex min-w-0 flex-1 flex-col gap-8 lg:px-12 lg:py-8">
        <ListingsToolbar total={data?.total ?? 0} sort={sort} onSortChange={updateSort} />

        {error ? (
          <ErrorState title="Couldn't load properties" body="Please try again in a moment." />
        ) : isLoading ? (
          <ListingsGridSkeleton />
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
            <ListingsGrid items={data?.items ?? []} />
          </div>
        )}

        <ListingsPagination page={page} totalPages={data?.total_pages ?? 1} onPageChange={setPage} />
      </div>
    </div>
  );
}
