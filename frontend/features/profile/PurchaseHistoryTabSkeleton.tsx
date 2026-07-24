// features/profile/PurchaseHistoryTabSkeleton.tsx
// Loading placeholder for the Purchase History tab (Figma skeleton
// frame under 470:2479's "HistoryTab"), shown by ProfileLayout's
// AuthGuard fallback while the session resolves. The real tab isn't
// built yet — it needs an offers/transactions backend that doesn't
// exist — so this mirrors Figma's shape (heading + 3 stat cards, a
// 5-column table) without a real data-fetching tab to pair it with.
// Move this into a real PurchaseHistoryTab.tsx once that lands.

import { Skeleton } from "@/components/ui/skeleton";

export function PurchaseHistoryTabSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Skeleton className="h-7 w-48" />

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1.5 rounded-lg border-[0.8px] border-[#e4e4e4] bg-[#f8f9fa] px-4 py-3">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border-[0.8px] border-[#f1f5f9] bg-[#fefeff]">
        <div className="flex items-center justify-between gap-4 border-b-[0.8px] border-[#f1f5f9] bg-[#f8f9fa] px-6 py-3">
          {["w-16", "w-10", "w-10", "w-14", "w-12"].map((width, index) => (
            <Skeleton key={index} className={`h-3 ${width}`} />
          ))}
        </div>

        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={`flex items-center justify-between gap-4 px-6 py-4 ${index < 5 ? "border-b-[0.8px] border-[#f8fafc]" : ""}`}
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
