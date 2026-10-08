// app/(broker)/broker/layout.tsx
// Sidebar shell for every Broker Portal page, gated by AuthGuard: a
// logged-out visitor is redirected to /login, and a logged-in client
// visitor is redirected home. Nav matches the Figma "Blank screen" sidebar
// (node 643:355) — logo mark, 5-item nav (Home/Listings/Leads/Analytics/
// Profile, no Messages — that Figma screen doesn't show one) with a dark
// active pill and a broker name/avatar footer. The dark active-pill/16px
// Space Grotesk nav labels are applied via a local CSS var override (see
// below) rather than changing the shared sidebar's global tokens, since
// components/shared/Sidebar.tsx is also used by the Admin portal.
//
// Dashboard, Listings, Leads, Analytics, and Profile always navigate — each
// renders real content or its own empty state (Analytics shows the "add a
// property" empty state for a broker with zero listings).
//
// No top header bar (sidebar-toggle icon, page label) above the content —
// the Figma "Real Estate Broker Portal" screens (e.g. node 176:789) don't
// have one; the sidebar is always visible with no collapse control.

"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, Home, UserRound, Users2 } from "lucide-react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar, { type AppSidebarClassNames, type SidebarNavGroup } from "@/components/shared/Sidebar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAuthStore } from "@/lib/stores/auth";
import { UserRole } from "@/lib/enums";
import { toast } from "@/lib/toast";
import { initials } from "@/lib/utils";

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

// Pages that render real content (or their own empty state) regardless of
// listing count; any other nav href falls back to the "coming soon" toast.
// Spacing and type from the Figma broker sidebar: a 76px logo header, nav items
// flush beneath it (37px tall, 2px apart, 6px radius, 16px muted text), and a
// 70px footer separated by a hairline.
const BROKER_SIDEBAR_CLASSNAMES: AppSidebarClassNames = {
  header: "p-6",
  content: "gap-0",
  group: "px-3 py-0",
  menu: "gap-0.5",
  item: "h-[37px] gap-3 rounded-[6px] px-3 py-2 text-brand-primary-300 [&>svg]:size-[18px]",
  footer: "h-[70px] gap-0 border-t border-[#f3f4f6] px-4 pt-[17px]",
};

const BUILT_ROUTES =new Set(["/broker/dashboard", "/broker/listings", "/broker/leads", "/broker/analytics", "/broker/profile"]);

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <AuthGuard allowedRoles={[UserRole.broker]}>
      <div
        className="contents"
        // Selected item is the dark brand fill (Figma); hover is a light grey so
        // the two states stay distinguishable.
        style={
          {
            "--sidebar-accent": "var(--brand-secondary-500)",
            "--sidebar-accent-foreground": "var(--brand-primary-400)",
            "--sidebar-active": "var(--brand-primary-400)",
            "--sidebar-active-foreground": "var(--brand-secondary-400)",
          } as React.CSSProperties
        }
      >
        <SidebarProvider>
          <AppSidebar
            groups={NAV_GROUPS}
            activeRoute={pathname}
            classNames={BROKER_SIDEBAR_CLASSNAMES}
            onNavigate={(href) => {
              if (BUILT_ROUTES.has(href)) {
                router.push(href);
              } else {
                toast.info("Coming soon — this page isn't built yet.");
              }
            }}
            header={
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-[4px] bg-brand-primary-400">
                  <span className="font-heading text-[13px] font-bold text-brand-secondary-400">H</span>
                </div>
                <span className="font-heading text-[16px] font-medium text-brand-primary-400">Homigrow</span>
              </div>
            }
            footer={
              <div className="flex items-center gap-3">
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
          <SidebarInset className="bg-secondary">
            <main className="relative flex-1 p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </AuthGuard>
  );
}
