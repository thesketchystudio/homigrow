// lib/auth/session.ts
// Bootstraps the in-memory authStore from the httpOnly refresh cookie on
// first load, since the access token itself never survives a page reload.
// Called from AuthGuard and TopNavBar; delegates to client.ts's
// refreshAccessToken() rather than calling /auth/refresh itself, so
// every caller — this bootstrap, and apiRequest's own 401-retry — shares
// the exact same in-flight promise. Two independent concurrent calls to
// the refresh endpoint would each carry the same one-time-use refresh
// cookie, and the second to arrive trips the backend's reuse-detection
// (looks like a replayed, already-rotated token) and revokes the whole
// session — a real race this used to hit whenever a protected query and
// AuthGuard mounted at once.

import { refreshAccessToken } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth";

let resolvePromise: Promise<void> | null = null;

export function ensureAuthResolved(): Promise<void> {
  if (useAuthStore.getState().status !== "idle") {
    return resolvePromise ?? Promise.resolve();
  }

  if (!resolvePromise) {
    useAuthStore.setState({ status: "loading" });
    resolvePromise = refreshAccessToken()
      .then(() => undefined)
      .finally(() => {
        resolvePromise = null;
      });
  }

  return resolvePromise;
}
