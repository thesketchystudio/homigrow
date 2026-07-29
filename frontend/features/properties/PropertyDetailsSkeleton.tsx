// features/properties/PropertyDetailsSkeleton.tsx
// Loading placeholder for the Property Details page, shown while
// GET /properties/{id} resolves.

import { Skeleton } from "@/components/ui/skeleton";

export function PropertyDetailsSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-12 px-6 pt-28 pb-20">
      <div className="grid h-[350px] grid-cols-4 gap-4 sm:h-[500px] lg:h-[716px] lg:grid-cols-3">
        <Skeleton className="col-span-4 row-span-2 rounded lg:col-span-2" />
        <Skeleton className="col-span-2 hidden rounded lg:block" />
        <Skeleton className="col-span-2 hidden rounded lg:block" />
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-9 w-40" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="w-full lg:w-[380px] shrink-0">
          <Skeleton className="h-[500px] w-full rounded" />
        </div>
      </div>
    </div>
  );
}
