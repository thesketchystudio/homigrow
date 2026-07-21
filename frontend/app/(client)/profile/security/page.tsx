// app/(client)/profile/security/page.tsx
// Security tab placeholder — active-sessions UI (P2-T26 frontend half)
// and account deactivation (P2-T27 frontend half) land here next.

import { Shield } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";

export default function SecurityPage() {
  return <EmptyState icon={Shield} title="Security" body="Password, active sessions, and account deactivation will live here." />;
}
