// lib/api/endpoints/analytics.ts
// Broker-authenticated performance analytics — backs the Analytics page.
// Every number in the response is computed from real Lead/PropertyView
// rows (see the backend's analytics_service.py); nothing here is mocked.

import { apiRequest } from "@/lib/api/client";
import type { ListingType, PropertyType } from "@/lib/enums";

export type AnalyticsRange = "7d" | "30d" | "6m";

export type BrokerAnalyticsKpis = {
  total_views: number;
  total_views_change_pct: number | null;
  total_leads: number;
  total_leads_change_pct: number | null;
  enquiry_calls: number;
  enquiry_calls_change_pct: number | null;
  est_revenue: number;
  est_revenue_change_pct: number | null;
};

export type AnalyticsTrendPoint = {
  label: string;
  views: number;
  leads: number;
};

export type PropertyTypeBreakdownItem = {
  property_type: PropertyType;
  count: number;
  percent: number;
};

export type CityLeadCount = {
  city: string;
  count: number;
};

export type TopListingItem = {
  property_id: string;
  title: string;
  locality: string;
  city: string;
  price: number;
  listing_type: ListingType;
  views: number;
  leads: number;
  conversion_rate: number;
};

export type BrokerAnalyticsResponse = {
  range: AnalyticsRange;
  kpis: BrokerAnalyticsKpis;
  trend: AnalyticsTrendPoint[];
  property_type_breakdown: PropertyTypeBreakdownItem[];
  leads_by_city: CityLeadCount[];
  top_listings: TopListingItem[];
};

export function getBrokerAnalytics(range: AnalyticsRange): Promise<BrokerAnalyticsResponse> {
  return apiRequest<BrokerAnalyticsResponse>(`/analytics/broker?range=${range}`);
}
