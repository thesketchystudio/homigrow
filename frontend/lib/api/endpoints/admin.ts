// lib/api/endpoints/admin.ts
// Typed functions for the admin portal: the admin-only sign-in
// (/auth/admin/login) and the /admin resource — dashboard summary, listing
// management and moderation, and user management. Decimal amounts arrive
// as JSON strings from the backend, so they are typed as Decimal and
// converted with Number() at the point of display.

import { apiRequest } from "@/lib/api/client";
import type { LoginPayload, TokenResponse } from "@/lib/api/endpoints/auth";
import type {
  AdminAccountStatus,
  ListingType,
  PropertyStatus,
  PropertyType,
  UserRole,
  VerificationStatus,
} from "@/lib/enums";

export type Decimal = number | string;

export type AdminKpi = { value: Decimal; delta: Decimal; delta_label: string };

export type AdminSummary = {
  total_listings: AdminKpi;
  active_listings: AdminKpi;
  pending_reviews: AdminKpi;
  total_revenue: AdminKpi;
  monthly_traffic: { month: string; views: number; leads: number }[];
  listings_by_type: { property_type: PropertyType; count: number }[];
  recent_listings: {
    id: string;
    title: string;
    listing_type: ListingType;
    property_type: PropertyType;
    city: string;
    locality: string;
    price: Decimal;
    status: PropertyStatus;
    created_at: string;
  }[];
  pending_broker_verifications: number;
  total_users: number;
  recent_activity: {
    id: number;
    action: string;
    target_type?: string | null;
    target_id?: string | null;
    summary: string;
    created_at: string;
  }[];
};

export type AdminProperty = {
  id: string;
  title: string;
  listing_type: ListingType;
  property_type: PropertyType;
  status: PropertyStatus;
  price: Decimal;
  bhk?: number | null;
  bathrooms?: number | null;
  area_sqft?: Decimal | null;
  city: string;
  locality: string;
  cover_image_url?: string | null;
  is_featured: boolean;
  photo_count: number;
  has_video: boolean;
  has_jv_agreement: boolean;
  moderation_note?: string | null;
  broker: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    verification_status?: VerificationStatus | null;
  };
  created_at: string;
  updated_at?: string | null;
};

export type AdminPropertyStatusCounts = Record<PropertyStatus | "all", number>;

export type Paginated<T> = { items: T[]; page: number; page_size: number; total: number; total_pages: number };

export type AdminPropertyList = Paginated<AdminProperty> & { counts: AdminPropertyStatusCounts };

export type AdminPropertyQuery = {
  status?: PropertyStatus;
  q?: string;
  broker_id?: string;
  page?: number;
  page_size?: number;
};

export type AdminModerationStats = { awaiting_review: number; approved_today: number; rejected_today: number };

export type ModerationAction = "approve" | "reject";

export type AdminUser = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  status: AdminAccountStatus;
  listings_count: number;
  verification_status?: VerificationStatus | null;
  created_at: string;
};

export type AdminUserList = Paginated<AdminUser> & {
  stats: { total_users: number; active_brokers: number; pending_verification: number };
};

export type AdminUserDetail = AdminUser & {
  is_email_verified: boolean;
  suspended_at?: string | null;
  suspension_reason?: string | null;
  company_name?: string | null;
  rera_number?: string | null;
  experience_years?: number | null;
  active_listings_count: number;
  leads_count: number;
};

export type AdminUserQuery = {
  role?: "client" | "broker";
  q?: string;
  page?: number;
  page_size?: number;
};

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function adminLogin(payload: LoginPayload): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/admin/login", { method: "POST", body: payload });
}

export function getAdminSummary(): Promise<AdminSummary> {
  return apiRequest<AdminSummary>("/admin/summary");
}

export function listAdminProperties(query: AdminPropertyQuery): Promise<AdminPropertyList> {
  return apiRequest<AdminPropertyList>(`/admin/properties${toQueryString(query)}`);
}

export function getModerationStats(): Promise<AdminModerationStats> {
  return apiRequest<AdminModerationStats>("/admin/properties/moderation-stats");
}

export function moderateProperty(propertyId: string, action: ModerationAction, note?: string): Promise<unknown> {
  return apiRequest(`/admin/properties/${propertyId}/moderate`, { method: "POST", body: { action, note } });
}

export function listAdminUsers(query: AdminUserQuery): Promise<AdminUserList> {
  return apiRequest<AdminUserList>(`/admin/users${toQueryString(query)}`);
}

export function getAdminUser(userId: string): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${userId}`);
}

export function suspendUser(userId: string, reason: string): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${userId}/suspend`, { method: "POST", body: { reason } });
}

export function reinstateUser(userId: string): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${userId}/reinstate`, { method: "POST" });
}
