// features/profile/SavedTab.tsx
// "Saved" tab of Profile & Settings (Figma node 766:1397): the category
// pills and the Compare control above a two-column grid of the user's
// saved properties. Cards are the shared PropertyCard rendered through
// ListingsGrid, same as the standalone /saved page. Figma's cards also
// carry private notes and "Book a Private Tour"/"Contact Curator"
// buttons; no notes storage or curator service exists, so they are not
// rendered. The standalone /saved page stays in place alongside this tab.

"use client";

import Link from "next/link";

import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { CompareSelectionBar } from "@/features/properties/CompareSelectionBar";
import { ListingsGrid, ListingsGridSkeleton } from "@/features/properties/listings/ListingsGrid";
import { ListingsPagination } from "@/features/properties/listings/ListingsPagination";
import { SavedCategoryPills } from "@/features/properties/saved/SavedCategoryPills";
import { useSavedProperties } from "@/features/properties/saved/useSavedProperties";
import { useCompareStore } from "@/lib/stores/compare";

export function SavedTab() {
  const { category, page, setPage, changeCategory, data, isLoading, error, unsave, savedIds } = useSavedProperties();
  const compareIds = useCompareStore((state) => state.ids);
  const toggleCompare = useCompareStore((state) => state.toggle);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 pt-4 pb-6 sm:flex-row sm:items-center">
        <SavedCategoryPills category={category} onCategoryChange={changeCategory} />
        <CompareSelectionBar />
      </div>

      {error ? (
        <ErrorState title="Couldn't load your saved properties" body="Please try again in a moment." />
      ) : isLoading ? (
        <ListingsGridSkeleton count={4} />
      ) : (
        <ListingsGrid
          items={data?.items ?? []}
          savedIds={savedIds}
          onToggleSave={unsave}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          emptyState={
            <EmptyState
              title="Nothing saved yet"
              body="Save properties you're interested in and they'll show up here."
              action={
                <Link
                  href="/properties"
                  className="rounded-md bg-brand-primary-600 px-6 py-3 font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-100"
                >
                  Browse properties
                </Link>
              }
            />
          }
        />
      )}

      <ListingsPagination page={page} totalPages={data?.total_pages ?? 1} onPageChange={setPage} />
    </div>
  );
}

export function SavedTabSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-80 rounded-lg" />
        <Skeleton className="h-10 w-52 rounded-lg" />
      </div>
      <ListingsGridSkeleton count={4} />
    </div>
  );
}
