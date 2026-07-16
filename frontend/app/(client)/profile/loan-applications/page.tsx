// app/(client)/profile/loan-applications/page.tsx
// Loan Applications tab placeholder — full content lands in a later task.

import { FileText } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";

export default function LoanApplicationsPage() {
  return <EmptyState icon={FileText} title="Loan Applications" body="Track home-loan applications you've started here." />;
}
