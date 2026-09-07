// lib/api/endpoints/leads.ts
// Broker-authenticated lead pipeline: list every lead across the broker's
// properties, view one in detail with its note history, update its
// status/follow-up date, and log a note. Backed by /api/v1/leads.

import { apiRequest } from "@/lib/api/client";
import type { LeadStatus, ListingType } from "@/lib/enums";

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
