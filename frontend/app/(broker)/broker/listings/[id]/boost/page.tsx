// app/(broker)/broker/listings/[id]/boost/page.tsx
// Boost Listing page (Figma "Real Estate Broker Portal > BoostListing",
// node 178:5300) — reached from the Boost action on the Listings table or
// the Property Detail page. See BoostListingPage.tsx for the implementation.

"use client";

import { useParams } from "next/navigation";

import { BoostListingPage } from "@/features/broker/boost/BoostListingPage";

export default function BoostListing() {
  const params = useParams<{ id: string }>();
  return <BoostListingPage propertyId={params.id} />;
}
