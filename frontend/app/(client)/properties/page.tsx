// app/(client)/properties/page.tsx
// Listings/search screen (Figma "Curated Listings", node 28:646;
// 10_Phase_3.md P3-T10's frontend follow-up). Public route, no
// AuthGuard — GET /properties is unauthenticated. Not yet linked from
// PropertyCard elsewhere — that's a separate later task.
//
// Filter/sort/page state is synced to the URL query string (same param
// names the API itself uses) so a filtered view is bookmarkable/
// shareable — read on mount, written via router.replace (no history
// spam) on every change. useSearchParams requires a Suspense boundary
// for static rendering (same reason app/login/page.tsx wraps its inner
// component), hence the split between the default export and
// PropertiesListingsContent below.

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import ErrorState from "@/components/shared/ErrorState";
import Modal from "@/components/shared/Modal";
import { FilterSidebar } from "@/features/properties/listings/FilterSidebar";
import { ListingsToolbar } from "@/features/properties/listings/ListingsToolbar";
import { ListingsGrid, ListingsGridSkeleton } from "@/features/properties/listings/ListingsGrid";
import { ListingsPagination } from "@/features/properties/listings/ListingsPagination";
import { DEFAULT_FILTERS, type ListingsFilters, type SortValue } from "@/features/properties/listings/types";
import { buildQueryString, listProperties, type PropertyListParams } from "@/lib/api/endpoints/properties";
import { useSavedPropertyToggle } from "@/lib/hooks/useSavedPropertyToggle";
import { ListingType, PropertyType } from "@/lib/enums";

const PAGE_SIZE = 12;

function toListParams(filters: ListingsFilters, sort: SortValue, page: number): PropertyListParams {
  return {
    city: filters.city ?? undefined,
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

function parseStateFromSearchParams(searchParams: URLSearchParams): {
  filters: ListingsFilters;
  sort: SortValue;
  page: number;
} {
  const cityRaw = searchParams.get("city");
  const priceMin = Number(searchParams.get("price_min")) || DEFAULT_FILTERS.priceMin;
  const priceMax = Number(searchParams.get("price_max")) || DEFAULT_FILTERS.priceMax;
  const bhkMinRaw = searchParams.get("bhk_min");
  const listingTypeRaw = searchParams.get("listing_type");
  const sortRaw = searchParams.get("sort");
  const pageRaw = searchParams.get("page");

  return {
    filters: {
      city: cityRaw || null,
      priceMin,
      priceMax,
      bhkMin: bhkMinRaw ? Number(bhkMinRaw) : null,
      listingType: Object.values(ListingType).includes(listingTypeRaw as ListingType) ? (listingTypeRaw as ListingType) : null,
      propertyTypes: searchParams.getAll("property_type").filter((v) => Object.values(PropertyType).includes(v as PropertyType)) as PropertyType[],
      amenities: searchParams.getAll("amenities"),
    },
    sort: sortRaw === "price_asc" || sortRaw === "price_desc" ? sortRaw : "newest",
    page: pageRaw ? Math.max(1, Number(pageRaw)) : 1,
  };
}

function PropertiesListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = parseStateFromSearchParams(searchParams);

  const [filters, setFilters] = useState<ListingsFilters>(initial.filters);
  const [sort, setSort] = useState<SortValue>(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const params = toListParams(filters, sort, page);
  const { data, isLoading, isPlaceholderData, error } = useQuery({
    queryKey: ["properties", params],
    queryFn: () => listProperties(params),
    placeholderData: keepPreviousData,
  });
  const { savedIds, onToggleSave } = useSavedPropertyToggle();

  useEffect(() => {
    const query = buildQueryString(params);
    router.replace(query ? `/properties${query}` : "/properties", { scroll: false });
    // Only the filter/sort/page state should trigger a URL update — `params`
    // and `router` are derived/stable each render, not independent triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, page]);

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
      <FilterSidebar filters={filters} onChange={updateFilters} className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col gap-8 lg:px-12 lg:py-8">
        <ListingsToolbar
          total={data?.total ?? 0}
          city={filters.city}
          sort={sort}
          onSortChange={updateSort}
          onOpenFilters={() => setMobileFiltersOpen(true)}
        />

        {error ? (
          <ErrorState title="Couldn't load properties" body="Please try again in a moment." />
        ) : isLoading ? (
          <ListingsGridSkeleton />
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
            <ListingsGrid items={data?.items ?? []} savedIds={savedIds} onToggleSave={onToggleSave} />
          </div>
        )}

        <ListingsPagination page={page} totalPages={data?.total_pages ?? 1} onPageChange={setPage} />
      </div>

      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        variant="drawer"
        side="bottom"
        title={<span className="sr-only">Filters</span>}
        description={<span className="sr-only">Filter and sort the property listings.</span>}
        footer={
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="w-full rounded-md bg-brand-primary-600 py-4 font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-100"
          >
            Show {data?.total ?? 0} results
          </button>
        }
      >
        <FilterSidebar filters={filters} onChange={updateFilters} className="max-h-[70vh] overflow-y-auto p-0" />
      </Modal>
    </div>
  );
}

export default function PropertiesListingsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-350 px-6 pt-28 pb-20" />}>
      <PropertiesListingsContent />
    </Suspense>
  );
}
