// app/(broker)/broker/listings/[id]/page.tsx
// Broker Property Detail page (Figma "Real Estate Broker Portal > Property
// Detail", node 177:3345) — reached by clicking a listing row in
// BrokerListingsTable. See BrokerPropertyDetail.tsx for the implementation.

"use client";

import { useParams } from "next/navigation";

import { BrokerPropertyDetail } from "@/features/broker/listings/BrokerPropertyDetail";

export default function BrokerPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  return <BrokerPropertyDetail propertyId={params.id} />;
}
