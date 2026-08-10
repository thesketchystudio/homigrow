// lib/stores/auth.ts
// The one cross-cutting client-state store (ADR-007): current user + access
// token. The access token lives in memory only, never localStorage, so a
// full page reload always resets to "idle" and relies on
// ensureAuthResolved (lib/auth/session.ts) to restore it from the httpOnly
// refresh cookie.

import { create } from "zustand";
import type { UserOut } from "@/lib/api/endpoints/auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  user: UserOut | null;
  accessToken: string | null;
  status: AuthStatus;
  setAuth: (user: UserOut, accessToken: string) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setAuth: (user, accessToken) => set({ user, accessToken, status: "authenticated" }),
  clear: () => set({ user: null, accessToken: null, status: "unauthenticated" }),
}));
