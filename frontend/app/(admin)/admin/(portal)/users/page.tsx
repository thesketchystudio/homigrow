// app/(admin)/admin/(portal)/users/page.tsx
// Admin All Users route. Suspense is required because the screen reads
// its filters from the URL with useSearchParams.

import { Suspense } from "react";

import { AdminUsers } from "@/features/admin/users/AdminUsers";

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsers />
    </Suspense>
  );
}
