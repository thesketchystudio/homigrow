// app/(admin)/admin/(portal)/listings/page.tsx
// Admin All Listings route. Suspense is required because the screen reads
// its filters from the URL with useSearchParams.

import { Suspense } from "react";

import { AdminListings } from "@/features/admin/listings/AdminListings";

export default function AdminListingsPage() {
  return (
    <Suspense>
      <AdminListings />
    </Suspense>
  );
}
