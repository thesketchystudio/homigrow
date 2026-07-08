// app/(broker)/broker/layout.tsx
// Sidebar shell for every Broker Portal page. Auth guard (AuthGuard,
// Tier 2) is added in Phase 2 — this shell only wires navigation.

"use client";

import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, MessageSquare, Users2 } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar, { type SidebarNavGroup } from "@/components/shared/Sidebar";

const NAV_GROUPS: SidebarNavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/broker/dashboard", icon: LayoutDashboard },
      { label: "Listings", href: "/broker/listings", icon: Building2 },
      { label: "Leads", href: "/broker/leads", icon: Users2 },
      { label: "Messages", href: "/broker/messages", icon: MessageSquare },
    ],
  },
];

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <AppSidebar
        groups={NAV_GROUPS}
        activeRoute={pathname}
        header={<span className="px-2 text-sm font-semibold">Homigrow Broker</span>}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Broker Portal</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
