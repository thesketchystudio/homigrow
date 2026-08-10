// app/(client)/compare/page.tsx
// The full "Comparison" screen (Figma node 150:15348). Reads `ids` from
// the URL (?ids=a,b,c) rather than only the local compare store, so a
// shared /compare?ids=... link works even for a visitor whose
// localStorage never had anything selected — same shareable-URL
// precedent as the Listings page's filter state. useSearchParams
// requires a Suspense boundary for static rendering (same reason
// /properties and /reset-password split their page this way).

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { ComparePicker } from "@/features/properties/compare/ComparePicker";
import { ComparisonHeader } from "@/features/properties/compare/ComparisonHeader";
import { ComparisonPropertyCard } from "@/features/properties/compare/ComparisonPropertyCard";
import { ComparisonTable } from "@/features/properties/compare/ComparisonTable";
import { useCompareProperties } from "@/lib/hooks/useCompareProperties";
import { useCompareStore } from "@/lib/stores/compare";

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const removeFromCompare = useCompareStore((state) => state.remove);

  const { data, isLoading, error } = useCompareProperties(ids);
  const properties = data?.items ?? [];

  const handleRemove = (id: string) => {
    removeFromCompare(id);
    const nextIds = ids.filter((existing) => existing !== id);
    router.replace(nextIds.length > 0 ? `/compare?ids=${nextIds.join(",")}` : "/compare");
  };

  if (ids.length < 2) {
    return <ComparePicker />;
  }

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-8 px-6 pt-28 pb-20">
      <ComparisonHeader propertyCount={properties.length} />

      {error ? (
        <ErrorState title="Couldn't load these properties" body="Please try again in a moment." />
      ) : isLoading ? (
        <div className="text-brand-primary-600/70 py-10 text-center">Loading comparison…</div>
      ) : properties.length < 2 ? (
        <EmptyState
          title="Not enough properties to compare"
          body="One or more of the selected properties is no longer available."
          action={
            <Link href="/properties" className="rounded-md bg-brand-primary-600 px-6 py-3 font-heading text-[14px] font-bold uppercase tracking-[1.4px] text-brand-secondary-100">
              Browse properties
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <ComparisonPropertyCard key={property.id} property={property} onRemove={handleRemove} />
            ))}
          </div>

          <ComparisonTable properties={properties} />
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-350 px-6 pt-28 pb-20" />}>
      <ComparePageContent />
    </Suspense>
  );
}
