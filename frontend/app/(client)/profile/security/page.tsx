// app/(client)/profile/security/page.tsx
// Security tab placeholder — active-sessions UI and account
// deactivation land here next.

import { Shield } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";

export default function SecurityPage() {
  return <EmptyState icon={Shield} title="Security" body="Password, active sessions, and account deactivation will live here." />;
}
