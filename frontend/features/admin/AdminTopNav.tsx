// features/admin/AdminTopNav.tsx
// Top navigation bar for every Admin Portal page (Figma "TopNav", node
// 328:401): wordmark, the four section links with an underline on the
// active one, a bell that opens the Review Queue (with a dot while
// listings are waiting), and an account menu with sign-out. All in-app
// links are next/link so switching sections never reloads the page,
// which would re-run the session refresh on every click.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getModerationStats } from "@/lib/api/endpoints/admin";
import { logout as logoutRequest } from "@/lib/api/endpoints/auth";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "@/lib/utils";
import { ADMIN_MODERATION_STATS_KEY } from "@/features/admin/queryKeys";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Listings", href: "/admin/listings" },
  { label: "Users", href: "/admin/users" },
  { label: "Review Queue", href: "/admin/review-queue" },
];

export function AdminTopNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { data: stats } = useQuery({ queryKey: ADMIN_MODERATION_STATS_KEY, queryFn: getModerationStats });
  const awaiting = stats?.awaiting_review ?? 0;

  const handleSignOut = async () => {
    try {
      await logoutRequest();
    } catch {
      // A failed network call shouldn't block signing out locally.
    } finally {
      useAuthStore.getState().clear();
      // Hard navigation: a client-side push would race AuthGuard's own
      // redirect once the store is cleared (see ProfileSidebar's logout).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full reload, see above
      window.location.href = "/admin/login";
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(198,198,205,0.25)] bg-[rgba(248,249,250,0.92)] backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-10">
        <Link
          href="/admin/dashboard"
          className="font-heading text-[20px] font-bold leading-[30px] tracking-[-0.5px] text-brand-primary-600"
        >
          Homigrow
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Admin sections">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col gap-0.5 font-heading text-[15px] font-medium leading-[22.5px]",
                  active ? "text-brand-primary-600" : "text-slate-500 hover:text-brand-primary-600",
                )}
              >
                {item.label}
                <span className={cn("h-0.5 rounded-full", active ? "bg-brand-primary-600" : "bg-transparent")} />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/admin/review-queue"
            className="relative text-brand-primary-600 opacity-80 hover:opacity-100"
            aria-label={awaiting > 0 ? `${awaiting} listings awaiting review` : "Review queue"}
          >
            <Bell size={18} />
            {awaiting > 0 && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500" />}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="text-brand-primary-600 opacity-80 outline-none hover:opacity-100"
              aria-label="Account menu"
            >
              <UserRound size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span className="truncate font-heading text-[14px] text-brand-primary-600">{user?.full_name || "Admin"}</span>
                <span className="truncate text-[12px] font-normal text-slate-500">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut size={16} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <nav className="flex gap-6 overflow-x-auto px-4 pb-3 md:hidden" aria-label="Admin sections">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 font-heading text-[14px] font-medium",
                active ? "text-brand-primary-600 underline underline-offset-4" : "text-slate-500",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
