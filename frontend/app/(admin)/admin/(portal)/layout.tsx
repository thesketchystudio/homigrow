// app/(admin)/admin/(portal)/layout.tsx
// Shell for every signed-in Admin Portal page, gated by AuthGuard: a
// logged-out visitor is sent to the admin sign-in page (/admin/login), and
// a signed-in non-admin is sent to their own portal's home. The sign-in
// page sits outside this (portal) group so it is not itself guarded.

"use client";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { AdminFooter } from "@/features/admin/AdminChrome";
import { AdminTopNav } from "@/features/admin/AdminTopNav";
import { UserRole } from "@/lib/enums";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[UserRole.admin]} loginPath="/admin/login">
      <div className="flex min-h-svh flex-col bg-brand-secondary-400">
        <AdminTopNav />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-10 sm:px-10 sm:pt-12">{children}</main>
        <AdminFooter />
      </div>
    </AuthGuard>
  );
}
