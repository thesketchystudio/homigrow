// app/(client)/profile/purchase-history/page.tsx
// Purchase History tab placeholder — full content lands in a later task.

import { History } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";

export default function PurchaseHistoryPage() {
  return <EmptyState icon={History} title="Purchase History" body="Past transactions and bookings will show up here." />;
}
