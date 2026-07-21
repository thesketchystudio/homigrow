// app/(client)/profile/layout.tsx
// Shell for every Profile & Settings page (Figma node 145:4686): gates
// on being logged in (any role — a client/broker/admin all have their
// own account), fetches the caller's own profile once, and renders the
// shared ProfileSidebar next to whichever tab page is active. The
// TopNavBar/Footer still come from the parent (client) layout.

"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileSidebar } from "@/features/profile/ProfileSidebar";
import { getMe } from "@/lib/api/endpoints/users";
import { UserRole } from "@/lib/enums";

const ALL_ROLES: UserRole[] = [UserRole.client, UserRole.broker, UserRole.admin];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: getMe });

  return (
    <AuthGuard allowedRoles={ALL_ROLES}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-28 pb-16 md:flex-row md:gap-10">
        {isLoading || !user ? (
          <div className="flex w-full flex-col gap-4 md:w-[220px]">
            <Skeleton className="mx-auto size-16 rounded-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <ProfileSidebar user={user} activeRoute={pathname} />
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AuthGuard>
  );
}
