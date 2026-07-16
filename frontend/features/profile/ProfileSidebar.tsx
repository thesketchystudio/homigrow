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
// The Figma card here also shows decorative "Premium Member"/star-rating
// content with no backing field on the User model — replaced with the
// real is_email_verified flag instead of fabricating account status.

"use client";

import type { ComponentType } from "react";
import { Bell, Building2, CreditCard, FileText, FolderOpen, History, Shield, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserRead } from "@/lib/api/endpoints/users";

type NavItem = { label: string; href: string; icon: ComponentType<{ className?: string }> };

const PROFILE_ITEMS: NavItem[] = [
  { label: "Account", href: "/profile/account", icon: User },
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

export function ProfileSidebar({ user, activeRoute }: { user: UserRead; activeRoute: string }) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-8 md:w-[220px]">
      <div className="flex flex-col items-center gap-4 border-b-[0.8px] border-slate-100 pb-8 text-center">
        <div className="relative">
          <Avatar className="size-[72px] border-[1.6px] border-slate-200">
            <AvatarImage src={user.avatar_url} alt={user.full_name ?? "Profile photo"} />
            <AvatarFallback className="font-heading text-[16px] font-bold text-brand-primary-600">
              {initials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="bg-brand-primary-600 absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full">
            <User className="size-2.5 text-background" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="font-heading text-brand-primary-600 text-[16px] font-bold">{user.full_name ?? user.phone}</p>
          <p className="font-body text-[12px] text-slate-500">{user.is_email_verified ? "Verified Buyer" : "Unverified"}</p>
        </div>
      </div>

      <NavGroup label="Profile" items={PROFILE_ITEMS} activeRoute={activeRoute} />
      <NavGroup label="Settings" items={SETTINGS_ITEMS} activeRoute={activeRoute} />

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

function NavGroup({ label, items, activeRoute }: { label: string; items: NavItem[]; activeRoute: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-heading px-3.5 text-[10px] tracking-[1px] text-slate-400 uppercase">{label}</p>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeRoute === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-lg pl-3.5 font-heading text-[16px] font-medium transition-colors",
              isActive ? "bg-brand-primary-600 text-background" : "text-slate-500 hover:bg-slate-50",
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
