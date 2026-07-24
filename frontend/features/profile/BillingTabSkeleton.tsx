// features/profile/BillingTabSkeleton.tsx
// Loading placeholder for the Billing tab (Figma skeleton frame
// 470:5601's "BillingTab"), shown by ProfileLayout's AuthGuard
// fallback while the session resolves. The real tab isn't built yet —
// it needs a subscriptions/payments backend that doesn't exist at all
// — so this mirrors Figma's shape (dark current-plan card, payment
// methods list, billing history list) without a real data-fetching
// tab to pair it with. Move this into a real BillingTab.tsx once that
// lands.

import { Skeleton } from "@/components/ui/skeleton";

export function BillingTabSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Skeleton className="h-7 w-24" />

      <div className="flex items-center justify-between gap-4 rounded-xl bg-[#1a1a1a] p-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-2.5 w-24 bg-white/20" />
          <Skeleton className="h-6 w-40 bg-white/20" />
          <Skeleton className="h-3 w-48 bg-white/20" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <Skeleton className="h-5 w-16 bg-white/20" />
          <Skeleton className="h-9 w-28 rounded bg-white/20" />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border-[0.8px] border-[#e4e4e4] bg-[#fefeff] p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 border-b-[0.8px] border-[#f1f5f9] pb-4 last:border-0 last:pb-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-9 rounded" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border-[0.8px] border-[#e4e4e4] bg-[#fefeff] p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 border-b-[0.8px] border-[#f1f5f9] pb-4 last:border-0 last:pb-0">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="size-5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
