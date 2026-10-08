// app/(client)/profile/layout.tsx
// Shell for every Profile & Settings page (Figma node 145:4686): gates
// on being logged in (any role — a client/broker/admin all have their
// own account), fetches the caller's own profile once, and renders the
// shared ProfileSidebar next to whichever tab page is active. The
// TopNavBar/Footer still come from the parent (client) layout.
//
// The "Settings" title/subtitle, with any per-tab action button(s) on its
// right, is full-width above the sidebar+content row (Figma node 145:4687),
// so it lives here rather than in each tab component. "Settings" + its
// subtitle are static and identical across every tab in the Figma file, so
// they're hardcoded once here rather than threaded per-tab.
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

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { ProfileSidebar } from "@/features/profile/ProfileSidebar";
import { ProfileHeaderActionsProvider } from "@/features/profile/ProfileHeaderActions";
import { AccountTabSkeleton } from "@/features/profile/AccountTab";
import { PreferencesTabSkeleton } from "@/features/profile/preferences/PreferencesTab";
import { SavedTabSkeleton } from "@/features/profile/SavedTab";
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
    case "/profile/saved":
      return <SavedTabSkeleton />;
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
  return (
    <div className="flex min-h-[70px] items-center justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-brand-primary-400 text-[36px] leading-[44px] font-bold">Settings</h1>
        <p className="font-body text-brand-primary-600/70 text-[16px] leading-[26px]">
          Manage your architectural preferences and account security.
        </p>
      </div>
      {actions}
    </div>
  );
}

// Page shell matching Figma's ProfileSettingsPage: a #f8f9fa band with 60px
// of top padding below the nav, 150px side gutters, a 1004px content width
// (220px sidebar + 48px gap + 736px tab) and 48px between header and body.
function ProfileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f8f9fa] px-6 pt-[140px] pb-12 lg:px-[150px]">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-12">{children}</div>
    </div>
  );
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getMe });

  return (
    <AuthGuard
      allowedRoles={ALL_ROLES}
      fallback={
        <ProfileShell>
          <ProfileHeader />
          <div className="flex flex-col gap-8 md:flex-row md:gap-12">
            <ProfileSidebar activeRoute={pathname} />
            <div className="min-w-0 flex-1">{tabSkeletonFor(pathname)}</div>
          </div>
        </ProfileShell>
      }
    >
      <ProfileHeaderActionsProvider>
        {(headerActions) => (
          <ProfileShell>
            <ProfileHeader actions={headerActions} />
            <div className="flex flex-col gap-8 md:flex-row md:gap-12">
              <ProfileSidebar user={user} activeRoute={pathname} />
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          </ProfileShell>
        )}
      </ProfileHeaderActionsProvider>
    </AuthGuard>
  );
}
