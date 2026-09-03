// app/(broker)/broker/listings/page.tsx
// A dedicated listings-management table (filters, bulk actions, etc.) is
// future work — until then this shows the same real empty-state/status-
// list as the Dashboard (BrokerListingsPanel), since both currently have
// the same data behind them.

import { BrokerListingsPanel } from "@/features/broker/BrokerListingsPanel";

export default function BrokerListingsPage() {
  return <BrokerListingsPanel heading="All Listings" />;
}
