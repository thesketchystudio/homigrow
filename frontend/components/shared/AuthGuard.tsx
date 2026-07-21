// components/shared/AuthGuard.tsx
// Per-portal layout wrapper (06_Component_Library.md, P2-T18): resolves the
// session from the httpOnly refresh cookie on first load, renders a
// skeleton while that resolves, then redirects a logged-out visitor to
// /login (with a returnTo) and a logged-in visitor whose role isn't
// allowed for this portal back home.

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ensureAuthResolved } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/stores/auth";
import type { UserRole } from "@/lib/enums";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuthStore();

  useEffect(() => {
    ensureAuthResolved();
  }, []);

  const roleAllowed = user !== null && allowedRoles.includes(user.role);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && !roleAllowed) {
      router.replace("/");
    }
  }, [status, roleAllowed, pathname, router]);

  if (status !== "authenticated" || !roleAllowed) {
    return (
      <div className="flex h-svh w-full flex-col gap-4 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
