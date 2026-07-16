// app/(client)/profile/documents/page.tsx
// Documents tab placeholder — full content lands in a later task.

import { FolderOpen } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";

export default function DocumentsPage() {
  return <EmptyState icon={FolderOpen} title="Documents" body="Uploaded KYC and property documents will show up here." />;
}
