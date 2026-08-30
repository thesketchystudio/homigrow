// app/(client)/properties/[id]/page.tsx
// Property Details screen (Figma node 31:1845, "property details").
// Public route, no AuthGuard — GET /properties/{id} is unauthenticated.
// Not yet linked from the homepage or PropertyCard — that's a separate,
// later task.

"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import ErrorState from "@/components/shared/ErrorState";
import { PropertyHeroGallery } from "@/features/properties/PropertyHeroGallery";
import { PropertyHeader } from "@/features/properties/PropertyHeader";
import { PropertyDescription } from "@/features/properties/PropertyDescription";
import { PropertyVaastuChecker } from "@/features/properties/PropertyVaastuChecker";
import { PropertyAmenities } from "@/features/properties/PropertyAmenities";
import { PropertyContactCard } from "@/features/properties/PropertyContactCard";
import { PropertyLoanCalculator } from "@/features/properties/PropertyLoanCalculator";
import { PropertyDetailsSkeleton } from "@/features/properties/PropertyDetailsSkeleton";
import { ApiError } from "@/lib/api/client";
import { getProperty } from "@/lib/api/endpoints/properties";
import { ListingType } from "@/lib/enums";

export default function PropertyDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data: property, isLoading, error } = useQuery({
    queryKey: ["property", params.id],
    queryFn: () => getProperty(params.id),
    retry: (failureCount, err) => err instanceof ApiError && err.status === 404 ? false : failureCount < 2,
  });

  if (isLoading) {
    return <PropertyDetailsSkeleton />;
  }

  if (error || !property) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-[1100px] px-6 pt-28 pb-20">
        <ErrorState
          title={notFound ? "Property not found" : "Couldn't load this property"}
          body={notFound ? "This listing may have been removed or is no longer available." : "Please try again in a moment."}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-16 px-6 pt-28 pb-20">
      <PropertyHeroGallery media={property.media} title={property.title} />

      <div className="flex flex-col gap-16 lg:flex-row lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-col gap-16">
          <PropertyHeader property={property} />
          <PropertyVaastuChecker />
          <PropertyDescription description={property.description} />
          <PropertyAmenities amenities={property.amenities} />
        </div>
        <div className="w-full shrink-0 lg:w-[380px]">
          <PropertyContactCard property={property} />
        </div>
      </div>

      {property.listing_type === ListingType.sale && <PropertyLoanCalculator propertyPrice={property.price} />}
    </div>
  );
}
