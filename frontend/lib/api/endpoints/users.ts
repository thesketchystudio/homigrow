// lib/api/endpoints/users.ts
// Typed functions for the /users/me resource.

import { apiRequest } from "@/lib/api/client";
import type { UserRole, VerificationStatus } from "@/lib/enums";

export type BrokerProfileOut = {
  rera_number?: string;
  verification_status: VerificationStatus;
  bio?: string;
  company_name?: string;
  experience_years?: number;
  specializations: string[];
  social_links: Record<string, string>;
  service_areas: string[];
};

export type UserRead = {
  id: string;
  // Nullable since backend migration M5 — Google Sign-In accounts have
  // no phone number.
  phone: string | null;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  preferences: Record<string, unknown>;
  broker_profile?: BrokerProfileOut;
};

export function getMe(): Promise<UserRead> {
  return apiRequest<UserRead>("/users/me");
}

export type UserUpdatePayload = {
  full_name?: string;
  email?: string;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
};

export function updateMe(payload: UserUpdatePayload): Promise<UserRead> {
  return apiRequest<UserRead>("/users/me", { method: "PATCH", body: payload });
}

export type PasswordChangePayload = {
  current_password: string;
  new_password: string;
};

export function changePassword(payload: PasswordChangePayload): Promise<void> {
  return apiRequest<void>("/users/me/password", { method: "PATCH", body: payload });
}
