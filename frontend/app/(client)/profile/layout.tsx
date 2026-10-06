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
  const router = useRouter();
  return (
    <>
      <div className="flex min-h-[53.8px] items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex size-12 shrink-0 items-center justify-center text-brand-secondary-800"
        >
          <svg viewBox="0 0 48 48" className="size-12 fill-current" aria-hidden="true">
            <path d="M42.7518 24C42.7518 24.5967 42.5147 25.169 42.0928 25.591C41.6708 26.0129 41.0985 26.25 40.5018 26.25H12.9393L22.5993 35.9081C23.022 36.3308 23.2594 36.9041 23.2594 37.5019C23.2594 38.0996 23.022 38.6729 22.5993 39.0956C22.1766 39.5183 21.6033 39.7558 21.0055 39.7558C20.4078 39.7558 19.8345 39.5183 19.4118 39.0956L5.91177 25.5956C5.70201 25.3866 5.53558 25.1382 5.42202 24.8647C5.30846 24.5912 5.25 24.298 5.25 24.0019C5.25 23.7057 5.30846 23.4125 5.42202 23.139C5.53558 22.8655 5.70201 22.6171 5.91177 22.4081L19.4118 8.9081C19.6211 8.69881 19.8695 8.53279 20.143 8.41952C20.4164 8.30625 20.7095 8.24795 21.0055 8.24795C21.3015 8.24795 21.5946 8.30625 21.8681 8.41952C22.1415 8.53279 22.39 8.69881 22.5993 8.9081C22.8086 9.1174 22.9746 9.36586 23.0879 9.63932C23.2011 9.91278 23.2594 10.2059 23.2594 10.5019C23.2594 10.7978 23.2011 11.0909 23.0879 11.3644C22.9746 11.6378 22.8086 11.8863 22.5993 12.0956L12.9393 21.75H40.5018C41.0985 21.75 41.6708 21.987 42.0928 22.409C42.5147 22.8309 42.7518 23.4032 42.7518 24Z" />
          </svg>
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
        <div className="mx-auto flex max-w-[1052px] flex-col gap-12 px-6 pt-[150px] pb-16">
          <ProfileHeader />
          <div className="flex flex-col gap-8 md:flex-row md:gap-12">
            <ProfileSidebar activeRoute={pathname} />
            <div className="min-w-0 flex-1">{tabSkeletonFor(pathname)}</div>
          </div>
        </div>
      }
    >
      <ProfileHeaderActionsProvider>
        {(headerActions) => (
          <div className="mx-auto flex max-w-[1052px] flex-col gap-12 px-6 pt-[150px] pb-16">
            <ProfileHeader actions={headerActions} />
            <div className="flex flex-col gap-8 md:flex-row md:gap-12">
              <ProfileSidebar user={user} activeRoute={pathname} />
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          </div>
        )}
      </ProfileHeaderActionsProvider>
    </AuthGuard>
  );
}
