// app/(client)/profile/billing/page.tsx
// Billing tab placeholder — full content lands in a later task.

import { CreditCard } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";

export default function BillingPage() {
  return <EmptyState icon={CreditCard} title="Billing" body="Payment methods and invoices will show up here." />;
}
