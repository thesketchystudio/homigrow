// features/profile/ProfileSidebar.tsx
// Left-column navigation for the client Profile & Settings section
// (Figma node 145:4686: user card, a "Profile" nav group, a "Settings"
// nav group, a support card). Colors/fonts/spacing pulled directly from
// Figma's get_design_context output for this node — near-black
// (brand-primary-600, #1a1a1a) for the active item and avatar badge, not
// the app's green --primary token, since this specific screen's own
// design uses black for its primary actions (matching the signup/login
// pages' black CTA buttons, not the shadcn scaffold's default green).
// Unlike the Broker/Admin portals, this section keeps the marketing
// site's TopNavBar/Footer chrome, so it's a plain static column rather
// than the shadcn app-shell Sidebar primitives those portals compose
// (components/shared/Sidebar.tsx) — that primitive is a fixed-position,
// collapsible/off-canvas app shell, which doesn't fit alongside a fixed
// top nav and a page footer.
// The Figma card's "Premium Member"/star-rating row has no backing field
// on the User model — per explicit product decision it's shown as static
// UI for every user (not derived from real tier/rating data), matching
// Figma exactly rather than being dropped.
//
// `user` is optional: the nav groups and support card are static (no
// backing data), so per Figma's own "skeleton" frames for this section
// (Components/Section 3) they render immediately — only the user card
// (avatar/name/status) skeletons while `getMe()` is still in flight,
// instead of the whole sidebar disappearing behind a generic placeholder.
//
// The "Log out" row (Figma node 570:1972, red #e24747 — not a token,
// no existing destructive color in globals.css is close enough to reuse)
// sits below a divider under the Settings group, calling the existing
// /auth/logout endpoint then clearing the local authStore. The local
// store is cleared even if the network call fails, since a client-side
// logout should never get stuck on a server round-trip.

"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { Bell, Building2, CreditCard, FileText, FolderOpen, Heart, History, LogOut, Shield, Star, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logout as logoutRequest } from "@/lib/api/endpoints/auth";
import type { UserRead } from "@/lib/api/endpoints/users";
import { useAuthStore } from "@/lib/stores/auth";

type NavItem = { label: string; href: string; icon: ComponentType<{ className?: string }> };

const PROFILE_ITEMS: NavItem[] = [
  { label: "Account", href: "/profile/account", icon: User },
  { label: "Preferences", href: "/profile/preferences", icon: Heart },
  { label: "My Properties", href: "/profile/my-properties", icon: Building2 },
  { label: "Purchase History", href: "/profile/purchase-history", icon: History },
  { label: "Loan Applications", href: "/profile/loan-applications", icon: FileText },
  { label: "Documents", href: "/profile/documents", icon: FolderOpen },
];

const SETTINGS_ITEMS: NavItem[] = [
  { label: "Notifications", href: "/profile/notifications", icon: Bell },
  { label: "Security", href: "/profile/security", icon: Shield },
  { label: "Billing", href: "/profile/billing", icon: CreditCard },
];

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileSidebar({ user, activeRoute }: { user?: UserRead; activeRoute: string }) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-8 md:w-[220px]">
      <div className="flex flex-col items-center gap-4 border-b-[0.8px] border-slate-100 pb-8 text-center">
        <div className="relative">
          {user ? (
            <Avatar className="size-[72px] border-[1.6px] border-slate-200">
              <AvatarImage src={user.avatar_url} alt={user.full_name ?? "Profile photo"} />
              <AvatarFallback className="font-heading text-[16px] font-bold text-brand-primary-600">
                {initials(user.full_name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Skeleton className="size-[72px] rounded-full border-[1.6px] border-slate-200" />
          )}
          <div className="bg-brand-primary-600 absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full">
            <User className="size-2.5 text-background" />
          </div>
        </div>
        {user ? (
          <div className="flex flex-col items-center gap-0.5">
            <p className="font-heading text-brand-primary-600 text-[16px] font-bold">{user.full_name ?? user.phone}</p>
            <p className="font-body text-[12px] text-slate-500">Premium Member</p>
            <div className="flex items-center gap-1">
              <Star className="size-2.5 fill-amber-400 text-amber-400" />
              <Star className="size-2.5 fill-amber-400 text-amber-400" />
              <Star className="size-2.5 fill-amber-400 text-amber-400" />
              <p className="font-body text-[12px] text-slate-500">{user.is_email_verified ? "Verified Buyer" : "Unverified"}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        )}
      </div>

      <NavGroup label="Profile" items={PROFILE_ITEMS} activeRoute={activeRoute} />
      <NavGroup label="Settings" items={SETTINGS_ITEMS} activeRoute={activeRoute} />

      <div className="flex flex-col gap-4 border-t-[0.8px] border-slate-100 pt-4">
        <LogoutButton />
      </div>

      <div className="bg-brand-green-100 flex flex-col gap-1 rounded-lg border border-slate-100 p-[18px]">
        <p className="font-body text-brand-primary-600 text-[12px] font-medium">Need help?</p>
        <p className="font-body text-[12px] text-slate-500">Reach out to our support team for anything account-related.</p>
        <a href="mailto:support@homigrow.com" className="font-body text-brand-primary-600 pt-2 text-[12px] font-medium">
          Contact Support →
        </a>
      </div>
    </aside>
  );
}

function LogoutButton() {
  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // A failed network call shouldn't block a client-side logout.
    } finally {
      useAuthStore.getState().clear();
      // A hard navigation, not router.push: this page sits behind AuthGuard,
      // so a client-side push races AuthGuard's own redirect (it re-evaluates
      // the now-cleared store while still mounted and wins, landing on
      // /login?returnTo=... instead of home). A full reload sidesteps the
      // race entirely and matches the store's own memory-only design, which
      // already treats a reload as the normal way to reset auth state.
      window.location.href = "/";
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex h-10 items-center gap-2 pl-3.5 font-heading text-[16px] font-bold text-[#e24747]"
    >
      <LogOut className="size-4" />
      Log out
    </button>
  );
}

function NavGroup({ label, items, activeRoute }: { label: string; items: NavItem[]; activeRoute: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-heading px-3.5 text-[10px] tracking-[1px] text-slate-400 uppercase">{label}</p>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeRoute === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-lg pl-3.5 font-heading text-[16px] font-medium transition-colors",
              isActive ? "bg-brand-primary-600 text-background" : "text-slate-500 hover:bg-slate-50",
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
