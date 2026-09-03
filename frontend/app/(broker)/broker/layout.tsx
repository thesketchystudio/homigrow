// app/(broker)/broker/layout.tsx
// Sidebar shell for every Broker Portal page, gated by AuthGuard: a
// logged-out visitor is redirected to /login, and a logged-in client
// visitor is redirected home. Nav matches the Figma "Blank screen" sidebar
// (node 643:355) — logo mark, 5-item nav (Home/Listings/Leads/Analytics/
// Profile, no Messages — that Figma screen doesn't show one) with a dark
// active pill, broker name/avatar footer, and the floating "+" post-
// property button. The dark active-pill/16px Space Grotesk nav labels are
// applied via a local CSS var override (see below) rather than changing
// the shared sidebar's global tokens, since components/shared/Sidebar.tsx
// is also used by the Admin portal.
//
// Dashboard and Listings always navigate — both render real content
// either way (BrokerListingsPanel shows the empty state or the actual
// list). Leads and Analytics have no real feature behind them yet, so
// they're gated on whether the broker has ANY listing at all: zero
// listings routes there to the "add a listing first" empty state (nudging
// a brand-new broker toward posting one); once they have at least one,
// those links go back to the old "coming soon" toast instead of a page
// that would otherwise misleadingly repeat the same empty-state pitch.
// Profile still always toasts (same pattern PropertyContactCard.tsx uses
// for unbuilt actions).
//
// The floating "+" opens the Post Property wizard in a new tab rather than
// navigating this one away — the wizard is a standalone flow (its own
// route group/layout, no sidebar; see app/(broker-post)/broker/listings/
// new/layout.tsx) that a broker may want to fill out alongside the portal
// they were already looking at.

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileText, Home, Plus, UserRound, Users2 } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar, { type SidebarNavGroup } from "@/components/shared/Sidebar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAuthStore } from "@/lib/stores/auth";
import { UserRole } from "@/lib/enums";
import { toast } from "@/lib/toast";
import { listMyProperties } from "@/lib/api/endpoints/properties";

const NAV_GROUPS: SidebarNavGroup[] = [
  {
    items: [
      { label: "Home", href: "/broker/dashboard", icon: Home },
      { label: "Listings", href: "/broker/listings", icon: FileText },
      { label: "Leads", href: "/broker/leads", icon: Users2 },
      { label: "Analytics", href: "/broker/analytics", icon: BarChart3 },
      { label: "Profile", href: "/broker/profile", icon: UserRound },
    ],
  },
];

// Always navigate — both render real content regardless of listing count.
const ALWAYS_BUILT_ROUTES = new Set(["/broker/dashboard", "/broker/listings"]);
// Navigate only while the broker has zero listings; once they have one,
// these fall back to the "coming soon" toast (see BrokerLeadsPage/
// BrokerAnalyticsPage, which self-correct the same way on a direct visit).
const GATED_ON_NO_LISTINGS_ROUTES = new Set(["/broker/leads", "/broker/analytics"]);

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

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: myProperties } = useQuery({ queryKey: ["broker-my-properties"], queryFn: listMyProperties });
  const hasListings = (myProperties?.length ?? 0) > 0;

  return (
    <AuthGuard allowedRoles={[UserRole.broker]}>
      <div
        className="contents"
        style={{ "--sidebar-accent": "var(--brand-primary-400)", "--sidebar-accent-foreground": "var(--brand-secondary-400)" } as React.CSSProperties}
      >
        <SidebarProvider>
          <AppSidebar
            groups={NAV_GROUPS}
            activeRoute={pathname}
            onNavigate={(href) => {
              if (ALWAYS_BUILT_ROUTES.has(href) || (GATED_ON_NO_LISTINGS_ROUTES.has(href) && !hasListings)) {
                router.push(href);
              } else {
                toast.info("Coming soon — this page isn't built yet.");
              }
            }}
            header={
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="flex size-7 items-center justify-center rounded-[4px] bg-brand-primary-400">
                  <span className="font-heading text-[13px] font-bold text-brand-secondary-400">H</span>
                </div>
                <span className="font-heading text-[16px] font-medium text-brand-primary-400">Homigrow</span>
              </div>
            }
            footer={
              <div className="flex items-center gap-3 border-t border-sidebar-border px-2 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-secondary-400">
                  <span className="font-heading text-[16px] font-medium text-brand-primary-400">{initials(user?.full_name)}</span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-heading text-[16px] font-medium text-brand-primary-400">
                    {user?.full_name ?? "Broker"}
                  </span>
                  <span className="font-body text-[12px] text-muted-foreground">Broker</span>
                </div>
              </div>
            }
          />
          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <span className="text-sm font-medium">Broker Portal</span>
            </header>
            <main className="relative flex-1 p-6">
              {children}
              <Link
                href="/broker/listings/new"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Post a new property"
                title="Post a new property"
                className="fixed bottom-8 right-8 flex size-14 items-center justify-center rounded-full bg-brand-green-500 text-brand-primary-700 shadow-lg"
              >
                <Plus size={24} />
              </Link>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </AuthGuard>
  );
}
