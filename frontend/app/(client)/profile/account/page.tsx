// app/(client)/profile/account/page.tsx
// Account tab — full field content lands in P2-T22.

import { User } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";

export default function AccountPage() {
  return <EmptyState icon={User} title="Account settings" body="Editable profile fields are coming in the next update." />;
}
