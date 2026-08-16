// app/(client)/profile/my-properties/page.tsx
// My Properties tab placeholder — full content lands in a later task.

import { Building2 } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";

export default function MyPropertiesPage() {
  return <EmptyState icon={Building2} title="My Properties" body="Properties you've listed or shortlisted will show up here." />;
}
