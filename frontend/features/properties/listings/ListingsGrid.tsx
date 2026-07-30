// features/properties/listings/ListingsGrid.tsx
// Maps PropertyListItem[] (GET /properties) onto the existing, shared
// PropertyCard (components/shared/PropertyCard.tsx) — previously only
// exercised in the /dev/components gallery, this is its first real use.
// Cards from this endpoint are always active listings (the backend only
// returns status=active), so no saved/sold state is wired here.

import { Skeleton } from "@/components/ui/skeleton";
import PropertyCard from "@/components/shared/PropertyCard";
import EmptyState from "@/components/shared/EmptyState";
import type { PropertyListItem } from "@/lib/api/endpoints/properties";
import { ListingType } from "@/lib/enums";
import { formatINR } from "@/lib/utils";

function formatListingPrice(item: PropertyListItem): string {
  if (item.listing_type === ListingType.sale) {
    return formatINR(item.price);
  }
  return `₹${Math.round(item.price).toLocaleString("en-IN")}/mo`;
}

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

export function ListingsGrid({ items }: { items: PropertyListItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="No properties match your filters" body="Try widening your price range or clearing a filter." />;
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
        />
      ))}
    </div>
  );
}
