// app/(client)/saved/page.tsx
// Saved properties screen (Figma "Client view" page, section "saved",
// node 133:3060, "Your Curated Collection"). Wires the TopNavBar's
// previously-dead "Saved" link.
//
// Reuses the shared ListingsGrid/ListingsPagination/PropertyCard, the
// same pattern as the /properties Listings page, rather than the bespoke
// larger cards Figma draws here — those cards add private notes and
// "Book a Private Tour"/"Contact Curator" actions with no backing data or
// service behind either. The category pills (All/Villas/Penthouses/
// Commercial) and "Recently Saved" sort are real, backed by property_type
// filter + sort support added to GET /saved-properties for this task —
// the sort control lives in the header row next to the title, matching
// Figma's actual layout (node 133:3062), not inline with the pills. The
// "Selected: N Properties"/"Compare" control from that same Filters frame
// (node 133:3084-133:3090) is wired in via CompareSelectionBar — no
// longer out of scope. The bottom "Schedule a Portfolio Review" CTA is
// real UI with a "coming soon" toast — no curator service exists to
// actually book.

"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AuthGuard } from "@/components/shared/AuthGuard";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { CompareSelectionBar } from "@/features/properties/CompareSelectionBar";
import { ListingsGrid, ListingsGridSkeleton } from "@/features/properties/listings/ListingsGrid";
import { ListingsPagination } from "@/features/properties/listings/ListingsPagination";
import { PortfolioReviewCta } from "@/features/properties/saved/PortfolioReviewCta";
import { SavedCategoryPills, categoryToPropertyTypes, type SavedCategory } from "@/features/properties/saved/SavedCategoryPills";
import { SavedSortControl } from "@/features/properties/saved/SavedSortControl";
import {
  listSavedProperties,
  unsaveProperty,
  type SavedPropertyListResponse,
  type SavedSort,
} from "@/lib/api/endpoints/savedProperties";
import { SAVED_IDS_QUERY_KEY } from "@/lib/hooks/useSavedPropertyToggle";
import { useCompareStore } from "@/lib/stores/compare";
import { UserRole } from "@/lib/enums";

const PAGE_SIZE = 12;
const ALL_ROLES: UserRole[] = [UserRole.client, UserRole.broker, UserRole.admin];

function SavedPropertiesContent() {
  const [category, setCategory] = useState<SavedCategory>("all");
  const [sort, setSort] = useState<SavedSort>("recent");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const propertyType = categoryToPropertyTypes(category);
  const queryKey = ["saved-properties", category, sort, page];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => listSavedProperties({ property_type: propertyType, sort, page, page_size: PAGE_SIZE }),
  });

  const unsaveMutation = useMutation({
    mutationFn: (id: string) => unsaveProperty(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["saved-properties"] });
      queryClient.invalidateQueries({ queryKey: SAVED_IDS_QUERY_KEY });
      // Unsaving the last item on a page beyond the first would otherwise
      // leave the view stuck showing an empty grid even though earlier
      // pages still have items — step back a page once the refetch
      // confirms this page is now empty.
      const refetched = queryClient.getQueryData<SavedPropertyListResponse>(queryKey);
      if (refetched && refetched.items.length === 0 && page > 1) {
        setPage(page - 1);
      }
    },
  });

  const changeCategory = (next: SavedCategory) => {
    setCategory(next);
    setPage(1);
  };

  const changeSort = (next: SavedSort) => {
    setSort(next);
    setPage(1);
  };

  const savedIds = new Set((data?.items ?? []).map((item) => item.id));
  const compareIds = useCompareStore((state) => state.ids);
  const toggleCompare = useCompareStore((state) => state.toggle);

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-8 px-6 pt-28 pb-20">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[32px] font-bold text-brand-primary-400 sm:text-[48px]">Your Curated Collection</h1>
          <p className="font-body text-[18px] text-brand-primary-600/70">
            {data
              ? `${data.total} exceptional ${data.total === 1 ? "property" : "properties"} meticulously selected for your portfolio`
              : "Loading your saved properties…"}
          </p>
        </div>
        <SavedSortControl sort={sort} onSortChange={changeSort} />
      </div>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <SavedCategoryPills category={category} onCategoryChange={changeCategory} />
        <CompareSelectionBar />
      </div>

      {error ? (
        <ErrorState title="Couldn't load your saved properties" body="Please try again in a moment." />
      ) : isLoading ? (
        <ListingsGridSkeleton />
      ) : (
        <ListingsGrid
          items={data?.items ?? []}
          savedIds={savedIds}
          onToggleSave={(id) => unsaveMutation.mutate(id)}
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

      <PortfolioReviewCta />
    </div>
  );
}

export default function SavedPropertiesPage() {
  return (
    <AuthGuard allowedRoles={ALL_ROLES}>
      <SavedPropertiesContent />
    </AuthGuard>
  );
}
