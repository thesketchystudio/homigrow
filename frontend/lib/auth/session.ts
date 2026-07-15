// lib/auth/session.ts
// Bootstraps the in-memory authStore from the httpOnly refresh cookie on
// first load, since the access token itself never survives a page reload.
// Called from AuthGuard; deduped across concurrent guard mounts via a
// module-level promise so only one /auth/refresh fires per page load.

import { refresh } from "@/lib/api/endpoints/auth";
import { useAuthStore } from "@/lib/stores/auth";

let resolvePromise: Promise<void> | null = null;

export function ensureAuthResolved(): Promise<void> {
  if (useAuthStore.getState().status !== "idle") {
    return Promise.resolve();
  }

  if (!resolvePromise) {
    useAuthStore.setState({ status: "loading" });
    resolvePromise = refresh()
      .then((data) => {
        useAuthStore.getState().setAuth(data.user, data.access_token);
      })
      .catch(() => {
        useAuthStore.getState().clear();
      })
      .finally(() => {
        resolvePromise = null;
      });
  }

  return resolvePromise;
}
