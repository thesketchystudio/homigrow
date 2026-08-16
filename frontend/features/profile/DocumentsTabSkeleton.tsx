// features/profile/DocumentsTabSkeleton.tsx
// Loading placeholder for the Documents tab (Figma skeleton frame
// 470:4129's "DocumentsTab"), shown by ProfileLayout's AuthGuard
// fallback while the session resolves. The real tab isn't built yet —
// it needs a file-storage backend that doesn't exist — so this
// mirrors Figma's shape (heading + button, a dashed drop-zone, a
// 6-row file list) without a real data-fetching tab to pair it with.
// Move this into a real DocumentsTab.tsx once that lands.

import { Skeleton } from "@/components/ui/skeleton";

export function DocumentsTabSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-44 rounded" />
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-[1.6px] border-dashed border-[#e4e4e4] bg-[#f8f9fa] px-6 py-10">
        <Skeleton className="size-6 rounded" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-40" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 rounded-lg border-[0.8px] border-[#f1f5f9] bg-[#fefeff] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-14 rounded" />
              <Skeleton className="size-7 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
