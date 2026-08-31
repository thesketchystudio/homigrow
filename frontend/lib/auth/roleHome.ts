// lib/auth/roleHome.ts
// Where each role lands after authenticating — a broker or admin has no
// use for the client homepage, so both LoginForm's post-login redirect
// and AuthGuard's role-mismatch redirect route through this instead of
// hardcoding "/".

import { UserRole } from "@/lib/enums";

const ROLE_HOME_PATHS: Record<UserRole, string> = {
  [UserRole.client]: "/",
  [UserRole.broker]: "/broker/dashboard",
  [UserRole.admin]: "/admin/dashboard",
};

export function getRoleHomePath(role: UserRole): string {
  return ROLE_HOME_PATHS[role];
}
