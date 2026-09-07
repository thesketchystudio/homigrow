// app/(broker)/broker/dashboard/page.tsx
// Real KPI/aggregate dashboard is a future task — until then this shows
// the Figma "Blank screen" empty state (via BrokerListingsPanel) when the
// broker has no listings yet, or a plain status list once they do. The
// Listings page has since gotten its own real table
// (features/broker/listings/BrokerListingsTable.tsx) — this stays simple.

import { BrokerListingsPanel } from "@/features/broker/BrokerListingsPanel";

export default function BrokerDashboardPage() {
  return <BrokerListingsPanel heading="Your Listings" />;
}
