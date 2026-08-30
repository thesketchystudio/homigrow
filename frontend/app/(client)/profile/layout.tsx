// app/(client)/profile/layout.tsx
// Shell for every Profile & Settings page (Figma node 145:4686): gates
// on being logged in (any role — a client/broker/admin all have their
// own account), fetches the caller's own profile once, and renders the
// shared ProfileSidebar next to whichever tab page is active. The
// TopNavBar/Footer still come from the parent (client) layout.
//
// The back-arrow + "Settings" title/subtitle + per-tab action button(s)
// row (Figma node 569:673/569:681) is full-width, above the sidebar+
// content row — confirmed against the Figma XML, where Frame 150 and the
// title Container are siblings of (not nested inside) the Sidebar+content
// Container. It lives here, not in each tab component, for exactly that
// reason. "Settings" + its subtitle are static and identical across every
// "Enhance filter sidebar features" copy in the Figma file (Account,
// Preferences, etc. all show the same subtitle text), so they're
// hardcoded once here rather than threaded per-tab. The back arrow is
// plain `router.back()` navigation — Discard Changes (a tab's own header
// action, via useProfileHeaderActions) is the dedicated "revert this
// form" action, not the back arrow.
//
// ProfileSidebar renders immediately regardless of load state — its nav
// groups are static, so per Figma's skeleton frames for this section only
// the user card (avatar/name) needs to skeleton, not the whole sidebar.
//
// Passes AuthGuard a fallback shaped like this same shell (sidebar +
// the active tab's own skeleton) so the brief window while the session
// resolves from the refresh cookie doesn't flash AuthGuard's generic
// placeholder first — the accurate skeleton shows immediately and simply
// keeps showing once `getMe()` starts loading, no visible swap.

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { ProfileSidebar } from "@/features/profile/ProfileSidebar";
import { ProfileHeaderActionsProvider } from "@/features/profile/ProfileHeaderActions";
import { AccountTabSkeleton } from "@/features/profile/AccountTab";
import { PreferencesTabSkeleton } from "@/features/profile/preferences/PreferencesTab";
import { NotificationsTabSkeleton } from "@/features/profile/NotificationsTab";
import { MyPropertiesTabSkeleton } from "@/features/profile/MyPropertiesTabSkeleton";
import { PurchaseHistoryTabSkeleton } from "@/features/profile/PurchaseHistoryTabSkeleton";
import { LoanApplicationsTabSkeleton } from "@/features/profile/LoanApplicationsTabSkeleton";
import { DocumentsTabSkeleton } from "@/features/profile/DocumentsTabSkeleton";
import { SecurityTabSkeleton } from "@/features/profile/SecurityTabSkeleton";
import { BillingTabSkeleton } from "@/features/profile/BillingTabSkeleton";
import { getMe } from "@/lib/api/endpoints/users";
import { UserRole } from "@/lib/enums";

const ALL_ROLES: UserRole[] = [UserRole.client, UserRole.broker, UserRole.admin];

function tabSkeletonFor(pathname: string) {
  switch (pathname) {
    case "/profile/account":
      return <AccountTabSkeleton />;
    case "/profile/preferences":
      return <PreferencesTabSkeleton />;
    case "/profile/my-properties":
      return <MyPropertiesTabSkeleton />;
    case "/profile/purchase-history":
      return <PurchaseHistoryTabSkeleton />;
    case "/profile/loan-applications":
      return <LoanApplicationsTabSkeleton />;
    case "/profile/documents":
      return <DocumentsTabSkeleton />;
    case "/profile/notifications":
      return <NotificationsTabSkeleton />;
    case "/profile/security":
      return <SecurityTabSkeleton />;
    case "/profile/billing":
      return <BillingTabSkeleton />;
    default:
      return null;
  }
}

function ProfileHeader({ actions }: { actions?: React.ReactNode }) {
  const router = useRouter();
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex size-12 shrink-0 items-center justify-center text-slate-500"
        >
          <ArrowLeft className="size-6" />
        </button>
        {actions}
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-brand-primary-400 text-[36px] leading-[44px] font-bold">Settings</h1>
        <p className="font-body text-brand-primary-600/70 text-[16px] leading-[26px]">
          Manage your architectural preferences and account security.
        </p>
      </div>
    </>
  );
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getMe });

  return (
    <AuthGuard
      allowedRoles={ALL_ROLES}
      fallback={
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-48 pb-16">
          <ProfileHeader />
          <div className="flex flex-col gap-8 md:flex-row md:gap-10">
            <ProfileSidebar activeRoute={pathname} />
            <div className="min-w-0 flex-1">{tabSkeletonFor(pathname)}</div>
          </div>
        </div>
      }
    >
      <ProfileHeaderActionsProvider>
        {(headerActions) => (
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-48 pb-16">
            <ProfileHeader actions={headerActions} />
            <div className="flex flex-col gap-8 md:flex-row md:gap-10">
              <ProfileSidebar user={user} activeRoute={pathname} />
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          </div>
        )}
      </ProfileHeaderActionsProvider>
    </AuthGuard>
  );
}
