// features/properties/compare/ComparePicker.tsx
// Shown on /compare whenever fewer than 2 properties are selected — lets
// the visitor pick directly from their saved/liked properties
// instead of just being told to go elsewhere. Reuses the exact same
// ListingsGrid + CompareSelectionBar wiring the Saved and Listings pages use,
// so toggling a checkbox here stays in sync with those pages' counters and
// the floating CompareDrawer.

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { CompareSelectionBar } from "@/features/properties/CompareSelectionBar";
import { ListingsGrid, ListingsGridSkeleton } from "@/features/properties/listings/ListingsGrid";
import { listSavedProperties } from "@/lib/api/endpoints/savedProperties";
import { useSavedPropertyToggle } from "@/lib/hooks/useSavedPropertyToggle";
import { useAuthStore } from "@/lib/stores/auth";
import { useCompareStore } from "@/lib/stores/compare";

export function ComparePicker() {
  const isAuthenticated = useAuthStore((state) => state.status === "authenticated");
  const { savedIds, onToggleSave } = useSavedPropertyToggle();
  const compareIds = useCompareStore((state) => state.ids);
  const toggleCompare = useCompareStore((state) => state.toggle);

  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-properties", "compare-picker"],
    queryFn: () => listSavedProperties({ page_size: 50, sort: "recent" }),
    enabled: isAuthenticated,
  });

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-8 px-6 pt-28 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-brand-primary-400 text-[32px] font-bold sm:text-[48px]">Comparison</h1>
        <p className="font-body text-brand-primary-600/70 text-[18px]">
          Select 2–3 properties below to compare, or pick more from Listings.
        </p>
      </div>

      <CompareSelectionBar />

      {!isAuthenticated ? (
        <EmptyState
          title="Log in to see your saved properties"
          body="Save properties you're interested in, then compare them here."
          action={
            <Link
              href="/login?returnTo=%2Fcompare"
              className="rounded-md bg-brand-primary-600 px-6 py-3 font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-100"
            >
              Log in
            </Link>
          }
        />
      ) : error ? (
        <ErrorState title="Couldn't load your saved properties" body="Please try again in a moment." />
      ) : isLoading ? (
        <ListingsGridSkeleton />
      ) : (
        <ListingsGrid
          items={data?.items ?? []}
          savedIds={savedIds}
          onToggleSave={onToggleSave}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          emptyState={
            <EmptyState
              title="Nothing saved yet"
              body="Save properties you're interested in and they'll show up here, ready to compare."
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
    </div>
  );
}
