// app/(admin)/admin/layout.tsx
// Sidebar shell for every Admin Portal page, gated by AuthGuard: a
// logged-out visitor is redirected to /login, and a non-admin visitor is
// redirected home.

"use client";

import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, ShieldCheck, Users2 } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar, { type SidebarNavGroup } from "@/components/shared/Sidebar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { UserRole } from "@/lib/enums";

const NAV_GROUPS: SidebarNavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users2 },
      { label: "Listings", href: "/admin/listings", icon: Building2 },
      { label: "Review Queue", href: "/admin/review-queue", icon: ShieldCheck },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard allowedRoles={[UserRole.admin]}>
      <SidebarProvider>
        <AppSidebar
          groups={NAV_GROUPS}
          activeRoute={pathname}
          header={<span className="px-2 text-sm font-semibold">Homigrow Admin</span>}
        />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">Admin Portal</span>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
