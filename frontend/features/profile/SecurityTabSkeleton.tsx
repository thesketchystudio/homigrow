// features/profile/SecurityTabSkeleton.tsx
// Loading placeholder for the Security tab (Figma skeleton frame
// 470:5148's "SecurityTab"), shown by ProfileLayout's AuthGuard
// fallback while the session resolves. The real tab isn't built yet —
// its design needs 2FA (deferred to P4) and a data-export section with
// no backend — so this mirrors Figma's shape (Security card with a
// 2FA toggle row and a change-password form, Privacy card with two
// toggle/action rows) without a real data-fetching tab to pair it
// with. Move this into a real SecurityTab.tsx once that lands.

import { Skeleton } from "@/components/ui/skeleton";

export function SecurityTabSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Skeleton className="h-7 w-40" />

      <div className="flex flex-col gap-6 rounded-xl border-[0.8px] border-[#e4e4e4] bg-[#fefeff] p-6">
        <Skeleton className="h-5 w-20" />

        <div className="flex items-center justify-between gap-4 border-b-[0.8px] border-[#f1f5f9] pb-6">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>

        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-[26px] w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-40 self-start rounded" />
      </div>

      <div className="flex flex-col gap-6 rounded-xl border-[0.8px] border-[#e4e4e4] bg-[#fefeff] p-6">
        <Skeleton className="h-5 w-16" />

        <div className="flex items-center justify-between gap-4 border-b-[0.8px] border-[#f1f5f9] pb-6">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-80" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-9 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}
