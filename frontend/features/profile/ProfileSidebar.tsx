// features/profile/ProfileSidebar.tsx
// Left-column navigation for the client Profile & Settings section
// (Figma node 145:4686: user card, a "Profile" nav group, a "Settings"
// nav group, a support card). Unlike the Broker/Admin portals, this
// section keeps the marketing site's TopNavBar/Footer chrome, so it's a
// plain static column rather than the shadcn app-shell Sidebar
// primitives those portals compose (components/shared/Sidebar.tsx) —
// that primitive is a fixed-position, collapsible/off-canvas app shell,
// which doesn't fit alongside a fixed top nav and a page footer.
// The Figma card here also shows decorative "Premium Member"/star-rating
// content with no backing field on the User model — replaced with the
// real is_email_verified flag instead of fabricating account status.

"use client";

import type { ComponentType } from "react";
import { Bell, Building2, CreditCard, FileText, FolderOpen, History, Shield, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    <aside className="flex w-full shrink-0 flex-col gap-6 md:w-[220px]">
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar className="size-16">
          <AvatarImage src={user.avatar_url} alt={user.full_name ?? "Profile photo"} />
          <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <p className="font-medium">{user.full_name ?? user.phone}</p>
          <Badge variant={user.is_email_verified ? "default" : "secondary"} className="mx-auto w-fit text-[11px]">
            {user.is_email_verified ? "Verified" : "Unverified"}
          </Badge>
        </div>
      </div>

      <NavGroup label="Profile" items={PROFILE_ITEMS} activeRoute={activeRoute} />
      <NavGroup label="Settings" items={SETTINGS_ITEMS} activeRoute={activeRoute} />

      <div className="bg-primary/5 border-primary/10 flex flex-col gap-2 rounded-lg border p-4">
        <p className="text-sm font-semibold">Need help?</p>
        <p className="text-muted-foreground text-xs">Reach out to our support team for anything account-related.</p>
        <a href="mailto:support@homigrow.com" className="text-primary text-xs font-semibold">
          Contact Support →
        </a>
      </div>
    </aside>
  );
}

function NavGroup({ label, items, activeRoute }: { label: string; items: NavItem[]; activeRoute: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground px-3 text-xs font-semibold tracking-wide uppercase">{label}</p>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeRoute === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
