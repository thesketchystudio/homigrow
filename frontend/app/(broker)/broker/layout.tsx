// app/(broker)/broker/layout.tsx
// Sidebar shell for every Broker Portal page, gated by AuthGuard: a
// logged-out visitor is redirected to /login, and a logged-in client
// visitor is redirected home. Matches the Figma "Broker view" dashboard
// section (node 176:2/176:303) — logo mark, 6-item nav with a dark
// active pill, broker name/avatar footer, and the floating "+" post-
// property button — pulled from that design context earlier in the
// session (Figma MCP later disconnected, so this is the last live pull,
// not a re-fetch). The dark active-pill/16px Space Grotesk nav labels
// are real values from that pull, applied via a local CSS var override
// (see below) rather than changing the shared sidebar's global tokens,
// since components/shared/Sidebar.tsx is also used by the Admin portal.
// Only Home/Dashboard has a real destination right now — every other
// nav item 404s if actually navigated to, so they toast "coming soon"
// instead (same pattern PropertyContactCard.tsx uses for unbuilt
// actions) rather than linking to a broken page.

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Building2, LayoutDashboard, MessageSquare, Plus, UserRound, Users2 } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar, { type SidebarNavGroup } from "@/components/shared/Sidebar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAuthStore } from "@/lib/stores/auth";
import { UserRole } from "@/lib/enums";
import { toast } from "@/lib/toast";

const NAV_GROUPS: SidebarNavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/broker/dashboard", icon: LayoutDashboard },
      { label: "Listings", href: "/broker/listings", icon: Building2 },
      { label: "Leads", href: "/broker/leads", icon: Users2 },
      { label: "Analytics", href: "/broker/analytics", icon: BarChart3 },
      { label: "Messages", href: "/broker/messages", icon: MessageSquare },
      { label: "Profile", href: "/broker/profile", icon: UserRound },
    ],
  },
];

// Only these actually exist — everything else in NAV_GROUPS toasts instead of navigating.
const BUILT_ROUTES = new Set(["/broker/dashboard"]);

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
              if (BUILT_ROUTES.has(href)) {
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
