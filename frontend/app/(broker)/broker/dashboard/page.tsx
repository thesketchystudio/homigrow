// app/(broker)/broker/dashboard/page.tsx
// Real Home/Dashboard (Figma "Real Estate Broker Portal" > Dashboard, node
// 176:2 on the "Broker view" page) — KPI stat cards, Recent Leads preview,
// and Active Listings preview. See BrokerHomeDashboard.tsx for the
// implementation; the "Blank screen" empty state still covers a broker with
// zero listings.

import { BrokerHomeDashboard } from "@/features/broker/BrokerHomeDashboard";

export default function BrokerDashboardPage() {
  return <BrokerHomeDashboard />;
}
