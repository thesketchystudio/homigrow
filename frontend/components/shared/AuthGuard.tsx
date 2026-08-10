// components/shared/AuthGuard.tsx
// Per-portal layout wrapper: resolves the
// session from the httpOnly refresh cookie on first load, renders a
// fallback while that resolves, then redirects a logged-out visitor to
// /login (with a returnTo) and a logged-in visitor whose role isn't
// allowed for this portal back home.
//
// `fallback` defaults to a generic skeleton (Broker/Admin's own portal
// shells don't customize it), but a caller can pass a page-shaped one —
// e.g. Profile's layout passes its real sidebar + tab skeleton, so the
// brief "session still resolving" window doesn't flash a visually
// different placeholder right before the page's own accurate skeleton
// takes over once `getMe()` starts loading.

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ensureAuthResolved } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/stores/auth";
import type { UserRole } from "@/lib/enums";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_FALLBACK = (
  <div className="flex h-svh w-full flex-col gap-4 p-6">
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-full w-full" />
  </div>
);

export function AuthGuard({
  allowedRoles,
  fallback = DEFAULT_FALLBACK,
  children,
}: {
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
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
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
