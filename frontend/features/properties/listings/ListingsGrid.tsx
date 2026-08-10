// features/properties/listings/ListingsGrid.tsx
// Maps PropertyListItem[] (GET /properties) onto the existing, shared
// PropertyCard (components/shared/PropertyCard.tsx) — previously only
// exercised in the /dev/components gallery, this is its first real use.
// Cards from this endpoint are always active listings (the backend only
// returns status=active), so no sold-state overlay is wired here — but
// the save toggle is real, driven by whichever page renders this grid
// via useSavedPropertyToggle. Reused as-is by the Saved properties page
// via SavedPropertyItem, which extends PropertyListItem with just a
// `saved_at` field — the `emptyState` prop
// lets each caller supply its own copy ("no filter matches" vs "nothing
// saved yet") without forking the grid/skeleton/mapping logic.
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import PropertyCard from "@/components/shared/PropertyCard";
import EmptyState from "@/components/shared/EmptyState";
import type { PropertyListItem } from "@/lib/api/endpoints/properties";
import { formatListingPrice } from "@/lib/utils";

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-xl border">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function ListingsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListingsGrid({
  items,
  savedIds,
  onToggleSave,
  compareIds,
  onToggleCompare,
  emptyState,
}: {
  items: PropertyListItem[];
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  compareIds?: string[];
  onToggleCompare?: (id: string) => void;
  emptyState?: ReactNode;
}) {
  if (items.length === 0) {
    return (
      emptyState ?? <EmptyState title="No properties match your filters" body="Try widening your price range or clearing a filter." />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <PropertyCard
          key={item.id}
          property={{
            id: item.id,
            title: item.title,
            imageUrl: item.cover_image_url ?? "/homepage/modern-mansion.png",
            price: formatListingPrice(item),
            location: `${item.locality}, ${item.city}`,
            bhk: item.bhk ?? undefined,
            areaSqft: item.area_sqft ?? undefined,
            href: `/properties/${item.id}`,
          }}
          isSaved={savedIds.has(item.id)}
          onToggleSave={onToggleSave}
          isComparing={compareIds?.includes(item.id) ?? false}
          onToggleCompare={onToggleCompare}
        />
      ))}
    </div>
  );
}
