// lib/api/endpoints/boost.ts
// Boost-plan catalog (public) and boost-order checkout (broker-only) —
// backs the Boost Listing page. No payment gateway is wired yet; an
// order is created and stays in "created" status.

import { apiRequest } from "@/lib/api/client";
import type { BoostTier, OrderStatus } from "@/lib/enums";

export type ReachEstimate = {
  views_min: number;
  views_max: number;
  leads_min: number;
  leads_max: number;
  calls_min: number;
  calls_max: number;
};

export type BoostPlan = {
  id: string;
  name: string;
  tier: BoostTier;
  price: number;
  features: string[];
  reach_estimate: ReachEstimate;
};

export function listBoostPlans(): Promise<BoostPlan[]> {
  return apiRequest<BoostPlan[]>("/boost-plans");
}

export type BoostOrderCreateInput = {
  property_id: string;
  plan_id: string;
  duration_days: 7 | 15 | 30;
};

export type BoostOrder = {
  id: string;
  property_id: string;
  plan_id: string;
  duration_days: number;
  base_amount: number;
  discount_amount: number;
  gst_amount: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
};

export function createBoostOrder(data: BoostOrderCreateInput): Promise<BoostOrder> {
  return apiRequest<BoostOrder>("/boost-orders", { method: "POST", body: data });
}
