// app/(client)/profile/layout.tsx
// Shell for every Profile & Settings page (Figma node 145:4686): gates
// on being logged in (any role — a client/broker/admin all have their
// own account), fetches the caller's own profile once, and renders the
// shared ProfileSidebar next to whichever tab page is active. The
// TopNavBar/Footer still come from the parent (client) layout.
//
// ProfileSidebar renders immediately regardless of load state — its nav
// groups are static, so per Figma's skeleton frames for this section only
// the user card (avatar/name) needs to skeleton, not the whole sidebar.

"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { ProfileSidebar } from "@/features/profile/ProfileSidebar";
import { getMe } from "@/lib/api/endpoints/users";
import { UserRole } from "@/lib/enums";

const ALL_ROLES: UserRole[] = [UserRole.client, UserRole.broker, UserRole.admin];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getMe });

  return (
    <AuthGuard allowedRoles={ALL_ROLES}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-28 pb-16 md:flex-row md:gap-10">
        <ProfileSidebar user={user} activeRoute={pathname} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AuthGuard>
  );
}
