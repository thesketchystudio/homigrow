// features/broker/profile/brokerLogout.ts
// Signs a broker out of the portal: revokes the refresh-token session via
// POST /auth/logout, clears the in-memory auth store, then hard-navigates
// home. The store is cleared even if the request fails, so signing out never
// gets stuck on a network round-trip.

import { logout } from "@/lib/api/endpoints/auth";
import { useAuthStore } from "@/lib/stores/auth";

export async function brokerLogout(): Promise<void> {
  try {
    await logout();
  } catch {
    // A failed network call shouldn't block a client-side logout.
  } finally {
    useAuthStore.getState().clear();
    // A hard navigation rather than router.push: the broker routes sit behind
    // AuthGuard, which would otherwise see the cleared store while still
    // mounted and redirect to /login?returnTo=... instead of home.
    window.location.href = "/";
  }
}
