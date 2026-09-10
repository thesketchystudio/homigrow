// app/(broker)/broker/listings/page.tsx
// Real Listings table (Figma "Real Estate Broker Portal > MyListings",
// node 176:789) — search, Type/Status filters, and per-row actions. See
// BrokerListingsTable.tsx for the implementation.

import { BrokerListingsTable } from "@/features/broker/listings/BrokerListingsTable";

export default function BrokerListingsPage() {
  return <BrokerListingsTable />;
}
