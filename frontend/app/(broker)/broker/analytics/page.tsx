// app/(broker)/broker/analytics/page.tsx
// Real Analytics page (Figma "Real Estate Broker Portal" > Analytics, node
// 177:1857) — KPI cards, Views & Leads trend, property-type/city
// breakdowns, and Top Performing Listings. See BrokerAnalytics.tsx for the
// implementation; the "Blank screen" empty state still covers a broker
// with zero listings.

import { BrokerAnalytics } from "@/features/broker/analytics/BrokerAnalytics";

export default function BrokerAnalyticsPage() {
  return <BrokerAnalytics />;
}
