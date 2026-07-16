// lib/api/endpoints/users.ts
// Typed functions for the /users/me resource (05_API_Design.md). Only
// the read used by the Profile shell so far — update/password-change
// land alongside the Account tab (P2-T22).

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
  phone: string;
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
