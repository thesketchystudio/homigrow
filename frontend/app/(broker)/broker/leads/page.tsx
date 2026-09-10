// app/(broker)/broker/leads/page.tsx
// Real Leads table (Figma "Real Estate Broker Portal > LeadsManagement",
// node 176:1436) — status tabs, search, and per-row actions. See
// BrokerLeadsTable.tsx for the implementation.

import { BrokerLeadsTable } from "@/features/broker/leads/BrokerLeadsTable";

export default function BrokerLeadsPage() {
  return <BrokerLeadsTable />;
}
