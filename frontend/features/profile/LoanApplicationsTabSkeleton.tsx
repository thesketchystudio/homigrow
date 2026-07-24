// features/profile/LoanApplicationsTabSkeleton.tsx
// Loading placeholder for the Loan Applications tab (Figma skeleton
// frame under 470:3374's "LoansTab" — the file has two pixel-identical
// copies of this frame, 470:3374 and 470:3866, confirmed via
// screenshot diff to be an accidental duplicate rather than two
// states), shown by ProfileLayout's AuthGuard fallback while the
// session resolves. The real tab isn't built yet — it needs a
// loan-application backend that doesn't exist — so this mirrors
// Figma's shape (heading + button, loan cards with a 4-stat row and a
// repayment-progress bar) without a real data-fetching tab to pair it
// with. Move this into a real LoanApplicationsTab.tsx once that lands.

import { Skeleton } from "@/components/ui/skeleton";

function LoanCardSkeleton({ showProgress }: { showProgress: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border-[0.8px] border-[#e4e4e4] bg-[#fefeff] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-14 rounded" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>

      {showProgress && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      )}
    </div>
  );
}

export function LoanApplicationsTabSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-40 rounded" />
      </div>

      <LoanCardSkeleton showProgress />
      <LoanCardSkeleton showProgress={false} />
    </div>
  );
}
