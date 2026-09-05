// lib/api/endpoints/leads.ts
// Typed function for the property-enquiry endpoint. LeadSource lives here
// (not lib/enums.ts) since it mirrors a plain String(30) source column, not
// a real backend Enum/Postgres-enum type like LeadStatus.

import { apiRequest } from "@/lib/api/client";
import type { LeadStatus } from "@/lib/enums";

export type LeadSource = "tour_request" | "number_request";

export type EnquireInput = {
  name: string;
  phone: string;
  source: LeadSource;
  message?: string;
  preferred_date?: string; // yyyy-mm-dd, matches <input type="date">'s value format
};

export type EnquireResponse = {
  id: string;
  status: LeadStatus;
  broker_name: string | null;
  broker_phone: string | null;
};

export function enquireProperty(propertyId: string, data: EnquireInput): Promise<EnquireResponse> {
  return apiRequest<EnquireResponse>(`/properties/${propertyId}/enquire`, { method: "POST", body: data });
}
