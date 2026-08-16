// features/profile/MyPropertiesTabSkeleton.tsx
// Loading placeholder for the My Properties tab (Figma skeleton frame
// 470:2009), shown by ProfileLayout's AuthGuard fallback while the
// session resolves. The real tab isn't built yet — it needs Property
// ownership data the backend doesn't expose yet — so this mirrors
// Figma's shape (heading + 2 stat cards, 3 property-card rows) without
// a real data-fetching tab to pair it with. Move this into a real
// MyPropertiesTab.tsx alongside the built tab once that lands.

import { Skeleton } from "@/components/ui/skeleton";

export function MyPropertiesTabSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-1.5 rounded-lg border-[0.8px] border-[#e4e4e4] bg-[#f8f9fa] px-4 py-2.5">
              <Skeleton className="h-2 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex overflow-hidden rounded-xl border-[0.8px] border-[#e4e4e4] bg-[#fefeff]">
          <Skeleton className="h-[150px] w-40 shrink-0 rounded-none" />
          <div className="flex flex-1 flex-col justify-center gap-3 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <Skeleton className="size-6 rounded" />
            </div>
            <Skeleton className="h-3.5 w-64" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
