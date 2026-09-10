// lib/api/endpoints/leads.ts
// Client-facing property-enquiry endpoint plus the broker-authenticated
// lead pipeline (list/detail/status update/notes) — both live under
// /api/v1/leads or /api/v1/properties/{id}/enquire. LeadSource lives here
// (not lib/enums.ts) since it mirrors a plain String(30) source column, not
// a real backend Enum/Postgres-enum type like LeadStatus.

import { apiRequest } from "@/lib/api/client";
import type { LeadStatus, ListingType } from "@/lib/enums";

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

export type LeadListItem = {
  id: string;
  status: LeadStatus;
  source: string;
  contact_name: string | null;
  contact_phone: string | null;
  message: string | null;
  follow_up_at: string | null;
  created_at: string;
  last_contacted_at: string | null;
  property_id: string;
  property_title: string;
  property_locality: string;
  property_city: string;
  property_price: number;
  property_listing_type: ListingType;
};

export type LeadNoteRead = {
  id: string;
  body: string;
  author_name: string | null;
  created_at: string;
};

export type LeadDetail = LeadListItem & { notes: LeadNoteRead[] };

export type LeadUpdateInput = {
  status?: LeadStatus;
  follow_up_at?: string;
};

export function listLeads(): Promise<LeadListItem[]> {
  return apiRequest<LeadListItem[]>("/leads");
}

export function getLead(id: string): Promise<LeadDetail> {
  return apiRequest<LeadDetail>(`/leads/${id}`);
}

export function updateLead(id: string, data: LeadUpdateInput): Promise<LeadListItem> {
  return apiRequest<LeadListItem>(`/leads/${id}`, { method: "PATCH", body: data });
}

export function addLeadNote(id: string, body: string): Promise<LeadNoteRead> {
  return apiRequest<LeadNoteRead>(`/leads/${id}/notes`, { method: "POST", body: { body } });
}
