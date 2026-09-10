// app/(broker)/broker/listings/[id]/edit/page.tsx
// Edit Listing page (Figma "Real Estate Broker Portal > Edit Listing", node
// 177:4065) — reached from the Edit action on the Listings table or the
// Property Detail page. See EditListingForm.tsx for the implementation.

"use client";

import { useParams } from "next/navigation";

import { EditListingForm } from "@/features/broker/edit-listing/EditListingForm";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  return <EditListingForm propertyId={params.id} />;
}
